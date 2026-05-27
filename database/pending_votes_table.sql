-- Table to temporarily store votes before payment
CREATE TABLE IF NOT EXISTS pending_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    vote_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_votes_session_id ON pending_votes(session_id);

-- Auto-delete expired pending votes (optional cleanup)
CREATE INDEX IF NOT EXISTS idx_pending_votes_expires_at ON pending_votes(expires_at);
