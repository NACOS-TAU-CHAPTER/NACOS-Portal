const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { reference, votes, voterId } = JSON.parse(event.body);
    
    if (!reference || !votes || votes.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    // 1. Verify Payment with Paystack
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY; // Set this in Netlify Env Vars
    
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`
      }
    });
    
    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return { statusCode: 400, body: JSON.stringify({ error: "Payment verification failed" }) };
    }

    // 2. Validate Amount Paid Matches Votes Requested
    const COST_PER_VOTE_NGN = 100; // Define your price per vote (e.g., 100 Naira)
    const totalVotesRequested = votes.reduce((sum, vote) => sum + (vote.vote_amount || 1), 0);
    const expectedAmountInKobo = totalVotesRequested * COST_PER_VOTE_NGN * 100;

    if (paystackData.data.amount < expectedAmountInKobo) {
      return { statusCode: 400, body: JSON.stringify({ error: "Amount paid does not cover the votes requested" }) };
    }

    // 3. Prepare Payload for Supabase
    const votesWithReference = votes.map(vote => ({
      ...vote,
      payment_reference: reference // This acts as our unique constraint
    }));

    // Initialize Supabase using Service Role Key (to bypass RLS for secure backend operations)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. Insert into Supabase
    const { error: dbError } = await supabase
      .from('votes')
      .insert(votesWithReference);

    if (dbError) {
      // Error code 23505 means unique constraint violation (Reference already used)
      if (dbError.code === '23505') {
        return { statusCode: 400, body: JSON.stringify({ error: "This payment reference has already been used for voting." }) };
      }
      console.error('Supabase Error:', dbError);
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to record votes in database." }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Votes successfully recorded!" })
    };

  } catch (error) {
    console.error('Server Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
