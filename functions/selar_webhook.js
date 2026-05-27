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
    reference = params.reference || params.transaction_reference;
    
    // Extract vote details from custom_notes or notes parameter
    if (params.custom_notes || params.notes) {
      try {
        voteDetails = JSON.parse(decodeURIComponent(params.custom_notes || params.notes));
      } catch (e) {
        console.error('Failed to parse notes from query params', e);
      }
    }

    transaction = {
      reference: reference,
      customer: {
        email: params.email || params.customer_email || 'unknown@email.com'
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
    if (!reference) {
      return { statusCode: 400, body: 'Missing transaction reference' };
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
          candidate: candidate,
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
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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
                  <strong>${v.category.replace(/-/g, ' ').toUpperCase()}:</strong> ${v.candidate} (${v.vote_amount} vote${v.vote_amount > 1 ? 's' : ''})
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
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};