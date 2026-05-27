-- =====================================================
-- Table: votes
-- Stores voting data for NACTA Awards
-- =====================================================

CREATE TABLE IF NOT EXISTS votes (
    id BIGSERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    candidate TEXT NOT NULL,
    vote_amount INTEGER NOT NULL DEFAULT 1,
    payment_reference TEXT UNIQUE NOT NULL,
    voter_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on payment_reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_votes_payment_reference ON votes(payment_reference);

-- Create index on category for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_votes_category ON votes(category);

-- Create index on candidate for counting votes
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate);

-- Enable Row Level Security
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read votes (for leaderboard)
CREATE POLICY "Anyone can view votes" ON votes
    FOR SELECT USING (true);

-- Policy: Service role can insert votes (from webhook)
-- Note: This will be handled by service_role key, no policy needed for INSERT

-- Add comment to table
COMMENT ON TABLE votes IS 'Stores votes for NACTA Awards 2026. Each payment_reference can only vote once (unique constraint).';

-- =====================================================
-- View: vote_leaderboard
-- Aggregates votes by candidate for easy leaderboard display
-- =====================================================

CREATE OR REPLACE VIEW vote_leaderboard AS
SELECT 
    category,
    candidate,
    SUM(vote_amount) as total_votes,
    COUNT(DISTINCT payment_reference) as number_of_voters,
    MAX(created_at) as last_vote_at
FROM votes
GROUP BY category, candidate
ORDER BY category, total_votes DESC;

-- Grant access to the view
GRANT SELECT ON vote_leaderboard TO anon, authenticated;

-- =====================================================
-- View: vote_summary
-- Overall voting statistics
-- =====================================================

CREATE OR REPLACE VIEW vote_summary AS
SELECT 
    COUNT(DISTINCT payment_reference) as total_voters,
    SUM(vote_amount) as total_votes,
    COUNT(DISTINCT category) as categories_voted,
    MIN(created_at) as first_vote_at,
    MAX(created_at) as last_vote_at
FROM votes;

-- Grant access to the view
GRANT SELECT ON vote_summary TO anon, authenticated;
