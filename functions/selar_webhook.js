const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

exports.handler = async (event, context) => {
  // Handle both GET (redirect) and POST (webhook) requests from Selar
  let transaction = {};
  let voteDetails = {};
  let reference = '';

  // CASE 1: GET request (Selar redirect URL after purchase)
  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    
    // Selar typically sends: reference, product_id, email, amount, etc.
    reference = params.reference || params.transaction_reference || params.payment_reference;
    const sessionId = params.session_id;
    const email = params.email || params.customer_email;
    
    // If no reference from Selar, generate one from email and timestamp
    if (!reference || reference.includes('{{') || reference.includes('{')) {
      reference = 'SELAR_' + Date.now() + '_' + email.split('@')[0];
      console.log('Generated reference:', reference);
    }
    
    // Try to get vote details from session_id (if provided)
    if (sessionId && !sessionId.includes('{{') && !sessionId.includes('{')) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: pendingVote, error: fetchError } = await supabase
        .from('pending_votes')
        .select('vote_data, session_id')
        .eq('session_id', sessionId)
        .single();
      
      if (!fetchError && pendingVote) {
        voteDetails = pendingVote.vote_data;
        console.log('Retrieved votes from session:', sessionId);
      }
    }
    
    // Fallback: Get most recent pending vote for this email
    if ((!voteDetails || Object.keys(voteDetails).length === 0) && email) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: recentVotes, error: fetchError } = await supabase
        .from('pending_votes')
        .select('vote_data, session_id')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!fetchError && recentVotes && recentVotes.length > 0) {
        voteDetails = recentVotes[0].vote_data;
        console.log('Retrieved most recent pending votes');
      }
    }
    
    // Fallback: Extract vote details from custom_notes or notes parameter (old method)
    if ((!voteDetails || Object.keys(voteDetails).length === 0) && (params.custom_notes || params.notes)) {
      try {
        voteDetails = JSON.parse(decodeURIComponent(params.custom_notes || params.notes));
      } catch (e) {
        console.error('Failed to parse notes from query params', e);
      }
    }

    transaction = {
      reference: reference,
      customer: {
        email: email || 'unknown@email.com'
      }
    };

    console.log('GET request received from Selar redirect:', params);
  }
  // CASE 2: POST request (Selar webhook - if they add support later)
  else if (event.httpMethod === 'POST') {
    // Securely verify that the request actually came from Selar
    const selarSecret = process.env.SELAR_SECRET_KEY;
    const signature = event.headers['x-selar-signature'] || event.headers['X-Selar-Signature'];
    
    if (selarSecret && signature) {
      const hash = crypto.createHmac('sha512', selarSecret)
                         .update(event.body)
                         .digest('hex');
      if (hash !== signature) {
        console.error('Invalid Selar signature');
        return { statusCode: 401, body: 'Unauthorized: Invalid signature' };
      }
    }

    try {
      // Selar sends the transaction payload in the body
      const payload = JSON.parse(event.body);

      // We only care about successful charges
      if (payload.event !== 'charge.success') {
        return { statusCode: 200, body: 'Event ignored' };
      }

      transaction = payload.data;
      reference = transaction.reference;
      
      // Extract the voting details from the 'notes' field we passed in the frontend URL
      if (transaction.notes) {
        try {
          voteDetails = JSON.parse(decodeURIComponent(transaction.notes));
        } catch (e) {
          console.error('Failed to parse notes as JSON', e);
        }
      }

      console.log('POST request received from Selar webhook:', payload);
    } catch (parseError) {
      console.error('Failed to parse POST body:', parseError);
      return { statusCode: 400, body: 'Invalid JSON payload' };
    }
  } else {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Common processing for both GET and POST
  try {
    // Debug logging
    console.log('Processing vote data...');
    console.log('Reference:', reference);
    console.log('Vote Details:', voteDetails);
    console.log('Transaction:', transaction);
    
    if (!reference) {
      console.error('Missing reference!');
      return { 
        statusCode: 400, 
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="error">✗ Missing Transaction Reference</div>
            <p>Please contact support.</p>
            <a href="https://nacos-tau.netlify.app">Return to Home</a>
          </body>
          </html>
        `
      };
    }

    if (!voteDetails || Object.keys(voteDetails).length === 0) {
      console.error('No voting data found');
      return { 
        statusCode: 200, 
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Successful</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
              .error { color: #dc3545; }
            </style>
          </head>
          <body>
            <div class="success">✓ Payment Successful!</div>
            <p class="error">However, we couldn't find your voting data. Please contact support with reference: ${reference}</p>
            <a href="https://nacos-tau.netlify.app">Return to Home</a>
          </body>
          </html>
        `
      };
    }

    // Format the votes into an array for the database
    const votesToInsert = [];
    const categories = new Set();
    
    // Group by category (ignoring the "-amount" keys initially)
    Object.keys(voteDetails).forEach(key => {
      if (!key.includes('-amount')) {
        categories.add(key);
      }
    });

    categories.forEach(category => {
      const candidate = voteDetails[category];
      const amount = parseInt(voteDetails[`${category}-amount`]) || 0;
      
      if (candidate && amount > 0) {
        votesToInsert.push({
          category: category,
          candidate_name: candidate,
          vote_amount: amount,
          payment_reference: reference, // Unique constraint prevents double-counting
          voter_email: transaction.customer.email,
          created_at: new Date().toISOString()
        });
      }
    });

    if (votesToInsert.length === 0) {
      return { 
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Payment Successful</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
              .error { color: #dc3545; }
            </style>
          </head>
          <body>
            <div class="success">✓ Payment Successful!</div>
            <p class="error">However, no valid votes were found. Please contact support.</p>
            <a href="https://nacos-tau.netlify.app">Return to Home</a>
          </body>
          </html>
        `
      };
    }

    // Initialize Supabase using the Service Role Key
    console.log('Initializing Supabase...');
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase credentials!');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Configuration Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="error">✗ Configuration Error</div>
            <p>Supabase credentials are not configured. Please set environment variables in Netlify.</p>
            <p><small>Reference: ${reference}</small></p>
            <a href="https://nacos-tau.netlify.app">Return to Home</a>
          </body>
          </html>
        `
      };
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Inserting votes:', votesToInsert);
    
    // Insert into Supabase
    const { error: dbError } = await supabase
      .from('votes')
      .insert(votesToInsert);

    if (dbError) {
      // Error code 23505 means unique constraint violation (Reference already used)
      if (dbError.code === '23505') {
        return { 
          statusCode: 200,
          headers: { 'Content-Type': 'text/html' },
          body: `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Already Processed</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .info { color: #17a2b8; font-size: 24px; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="info">ℹ Your votes have already been recorded!</div>
              <p>Reference: ${reference}</p>
              <a href="https://nacos-tau.netlify.app/voting_leaderboard.html">View Leaderboard</a>
            </body>
            </html>
          `
        };
      }
      console.error('Supabase Error:', dbError);
      return { 
        statusCode: 500,
        headers: { 'Content-Type': 'text/html' },
        body: `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="error">✗ Database Error</div>
            <p>Please contact support with reference: ${reference}</p>
            <a href="https://nacos-tau.netlify.app">Return to Home</a>
          </body>
          </html>
        `
      };
    }

    // Success! Return a nice HTML page
    return { 
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Votes Recorded Successfully</title>
          <meta http-equiv="refresh" content="5;url=https://nacos-tau.netlify.app/voting_leaderboard.html">
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              background: white;
              color: #333;
              padding: 40px;
              border-radius: 10px;
              max-width: 500px;
              margin: 0 auto;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .success { color: #28a745; font-size: 48px; margin-bottom: 20px; }
            h1 { color: #333; margin-bottom: 10px; }
            .votes { 
              background: #f8f9fa; 
              padding: 20px; 
              border-radius: 5px; 
              margin: 20px 0;
              text-align: left;
            }
            .vote-item { 
              padding: 8px 0; 
              border-bottom: 1px solid #dee2e6;
            }
            .vote-item:last-child { border-bottom: none; }
            a { 
              display: inline-block;
              margin-top: 20px;
              padding: 12px 30px;
              background: #28a745;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
            a:hover { background: #218838; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✓</div>
            <h1>Your Votes Have Been Recorded!</h1>
            <p>Thank you for participating in The NACTA Awards 2026</p>
            <div class="votes">
              <strong>Your Votes:</strong>
              ${votesToInsert.map(v => `
                <div class="vote-item">
                  <strong>${v.category.replace(/-/g, ' ').toUpperCase()}:</strong> ${v.candidate_name} (${v.vote_amount} vote${v.vote_amount > 1 ? 's' : ''})
                </div>
              `).join('')}
            </div>
            <p><small>Reference: ${reference}</small></p>
            <a href="https://nacos-tau.netlify.app/voting_leaderboard.html">View Leaderboard</a>
            <p><small>Redirecting in 5 seconds...</small></p>
          </div>
        </body>
        </html>
      `
    };
  } catch (error) {
    console.error('Webhook Error:', error);
    console.error('Error stack:', error.stack);
    return { 
      statusCode: 500,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="error">✗ Internal Server Error</div>
          <p>An error occurred while processing your votes.</p>
          <p><small>Error: ${error.message}</small></p>
          <p>Please contact support with this information.</p>
          <a href="https://nacos-tau.netlify.app">Return to Home</a>
        </body>
        </html>
      `
    };
  }
};