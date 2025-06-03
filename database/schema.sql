-- ========================================
-- VOICE COMPANION DATABASE SCHEMA
-- ========================================
-- This SQL script creates the necessary tables and functions for the voice companion application.
-- Run this in your Supabase SQL editor to set up the database.

-- Create the conversation_sessions table
CREATE TABLE conversation_sessions (
    -- Primary key: auto-generated UUID
    session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Device identifier to group conversations by device/user
    device_id VARCHAR(255) NOT NULL,
    
    -- Timestamps for session tracking
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- JSON array storing the conversation messages
    -- Structure: [{ timestamp: string, userMessage: string, aiResponse: string }]
    conversation JSONB DEFAULT '[]'::jsonb NOT NULL,
    
    -- Optional metadata for future enhancements
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Index for querying sessions by device_id (most common query)
CREATE INDEX idx_conversation_sessions_device_id 
ON conversation_sessions(device_id);

-- Index for querying recent sessions
CREATE INDEX idx_conversation_sessions_started_at 
ON conversation_sessions(started_at DESC);

-- Index for querying active sessions (not ended)
CREATE INDEX idx_conversation_sessions_active 
ON conversation_sessions(device_id, started_at DESC) 
WHERE ended_at IS NULL;

-- Composite index for device + time range queries
CREATE INDEX idx_conversation_sessions_device_time 
ON conversation_sessions(device_id, started_at DESC, ended_at);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on the table
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (you can restrict this later)
-- In production, you might want to restrict based on device_id or user authentication
CREATE POLICY "Allow all operations on conversation_sessions" 
ON conversation_sessions
FOR ALL 
USING (true)
WITH CHECK (true);

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on row changes
CREATE TRIGGER update_conversation_sessions_updated_at 
    BEFORE UPDATE ON conversation_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Function to get active sessions for a device
CREATE OR REPLACE FUNCTION get_active_sessions(device_uuid VARCHAR(255))
RETURNS TABLE(
    session_id UUID,
    started_at TIMESTAMP WITH TIME ZONE,
    conversation JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.session_id,
        cs.started_at,
        cs.conversation
    FROM conversation_sessions cs
    WHERE cs.device_id = device_uuid 
      AND cs.ended_at IS NULL
    ORDER BY cs.started_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent sessions for a device (last 30 days)
CREATE OR REPLACE FUNCTION get_recent_sessions(device_uuid VARCHAR(255))
RETURNS TABLE(
    session_id UUID,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    conversation JSONB,
    message_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.session_id,
        cs.started_at,
        cs.ended_at,
        cs.conversation,
        jsonb_array_length(cs.conversation) as message_count
    FROM conversation_sessions cs
    WHERE cs.device_id = device_uuid 
      AND cs.started_at >= NOW() - INTERVAL '30 days'
    ORDER BY cs.started_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old sessions (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversation_sessions 
    WHERE started_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SAMPLE DATA (OPTIONAL)
-- ========================================

-- Uncomment the following to insert sample data for testing
/*
INSERT INTO conversation_sessions (device_id, conversation) VALUES
(
    'test-device-1',
    '[
        {
            "timestamp": "2024-01-15T10:30:00.000Z",
            "userMessage": "Yesterday I had a really good conversation with my mom.",
            "aiResponse": "That sounds wonderful. What made the conversation with your mom particularly special yesterday?"
        },
        {
            "timestamp": "2024-01-15T10:31:00.000Z",
            "userMessage": "We talked about my childhood memories and she shared some stories I had never heard before.",
            "aiResponse": "How beautiful that you got to discover new stories about your past. Which story surprised you the most?"
        }
    ]'::jsonb
);
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Run these queries after setup to verify everything is working:

-- 1. Check table structure
-- SELECT * FROM information_schema.columns WHERE table_name = 'conversation_sessions';

-- 2. Check indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'conversation_sessions';

-- 3. Test session creation
-- SELECT * FROM conversation_sessions LIMIT 5;

-- 4. Test utility functions
-- SELECT * FROM get_recent_sessions('test-device-1');
