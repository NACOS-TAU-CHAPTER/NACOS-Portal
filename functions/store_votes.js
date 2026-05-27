const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { voteDetails } = JSON.parse(event.body);
    
    if (!voteDetails || Object.keys(voteDetails).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No vote details provided' })
      };
    }

    // Generate a unique session ID
    const sessionId = 'SESSION_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Store pending votes
    const { error } = await supabase
      .from('pending_votes')
      .insert({
        session_id: sessionId,
        vote_data: voteDetails,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing pending votes:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to store votes' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
