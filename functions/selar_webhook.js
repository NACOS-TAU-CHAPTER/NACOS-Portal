const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests from Selar
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Selar sends the transaction payload in the body
    const payload = JSON.parse(event.body);

    // We only care about successful charges
    if (payload.event !== 'charge.success') {
      return { statusCode: 200, body: 'Event ignored' };
    }

    const transaction = payload.data;
    const reference = transaction.reference;
    
    // Extract the voting details from the 'notes' field we passed in the frontend URL
    let voteDetails = {};
    if (transaction.notes) {
      try {
        voteDetails = JSON.parse(decodeURIComponent(transaction.notes));
      } catch (e) {
        console.error('Failed to parse notes as JSON', e);
      }
    }

    if (!voteDetails || Object.keys(voteDetails).length === 0) {
      return { statusCode: 400, body: 'No voting data found in notes' };
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
      return { statusCode: 400, body: 'No valid votes to insert' };
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
        return { statusCode: 200, body: 'Reference already processed' };
      }
      console.error('Supabase Error:', dbError);
      return { statusCode: 500, body: 'Database error while inserting votes' };
    }

    return { statusCode: 200, body: 'Webhook processed successfully' };
  } catch (error) {
    console.error('Webhook Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};