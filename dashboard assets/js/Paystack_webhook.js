const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;

  try {
    // 1. Verify the Paystack Signature
    const hash = crypto.createHmac('sha512', secret).update(event.body).digest('hex');
    if (hash !== event.headers['x-paystack-signature']) {
      console.warn('Invalid Paystack signature received');
      return { statusCode: 400, body: 'Invalid signature' };
    }

    // 2. Parse the Event
    const paystackEvent = JSON.parse(event.body);

    // We only care about successful charges
    if (paystackEvent.event === 'charge.success') {
      const data = paystackEvent.data;
      const reference = data.reference;
      const metadata = data.metadata;

      // Check if metadata contains our voting data
      if (metadata && metadata.votes && metadata.voterId) {
        const votes = JSON.parse(metadata.votes);
        const voterId = metadata.voterId;

        // 3. Validate the Amount (Extra security check)
        const COST_PER_VOTE_NGN = 100;
        const totalVotesRequested = votes.reduce((sum, vote) => sum + (vote.vote_amount || 1), 0);
        const expectedAmountInKobo = totalVotesRequested * COST_PER_VOTE_NGN * 100;

        if (data.amount < expectedAmountInKobo) {
          console.error(`Amount mismatch for ref ${reference}`);
          // Return 200 so Paystack stops retrying
          return { statusCode: 200, body: 'Ignored: Amount mismatch' }; 
        }

        // 4. Prepare Payload for Supabase
        const votesWithReference = votes.map(vote => ({
          ...vote,
          voter_id: voterId, 
          payment_reference: reference // Unique constraint
        }));

        // Initialize Supabase using Service Role Key
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        // 5. Insert into Supabase
        const { error: dbError } = await supabase.from('votes').insert(votesWithReference);

        if (dbError) {
          // Error code 23505 is PostgreSQL unique constraint violation.
          // This happens if the frontend successfully inserted the votes before this webhook fired.
          if (dbError.code === '23505') {
            console.log(`Votes for ref ${reference} already inserted (likely by frontend).`);
            return { statusCode: 200, body: 'Already processed' };
          }
          console.error('Supabase Error in Webhook:', dbError);
          return { statusCode: 500, body: 'Database error' };
        }

        console.log(`Successfully processed delayed votes for ref: ${reference}`);
      }
    }
    return { statusCode: 200, body: 'Webhook received' };
  } catch (error) {
    console.error('Webhook Error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
