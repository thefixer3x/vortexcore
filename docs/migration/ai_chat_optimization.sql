-- AI Chat Database Optimization Script
-- Optimizes the ai_chat_sessions table for better performance and functionality

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id_updated
ON public.ai_chat_sessions (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_created_at
ON public.ai_chat_sessions (created_at DESC);

-- Add a full-text search index for session names
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_session_name_fts
ON public.ai_chat_sessions USING gin(to_tsvector('english', COALESCE(session_name, '')));

-- Add a GIN index for message content search
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_messages_gin
ON public.ai_chat_sessions USING gin(messages);

-- Add columns for better session management (if they don't exist)
DO $$
BEGIN
    -- Add is_active column to track active sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='ai_chat_sessions' AND column_name='is_active') THEN
        ALTER TABLE public.ai_chat_sessions ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add last_message_at for quick sorting by activity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='ai_chat_sessions' AND column_name='last_message_at') THEN
        ALTER TABLE public.ai_chat_sessions ADD COLUMN last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;

    -- Add message_count for quick statistics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='ai_chat_sessions' AND column_name='message_count') THEN
        ALTER TABLE public.ai_chat_sessions ADD COLUMN message_count INTEGER DEFAULT 0;
    END IF;

    -- Add session_metadata for extensible session data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='ai_chat_sessions' AND column_name='session_metadata') THEN
        ALTER TABLE public.ai_chat_sessions ADD COLUMN session_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Update existing records with computed values
UPDATE public.ai_chat_sessions
SET
    message_count = jsonb_array_length(COALESCE(messages, '[]'::jsonb)),
    last_message_at = COALESCE(updated_at, created_at)
WHERE message_count IS NULL OR message_count = 0;

-- Create a function to automatically update last_message_at and message_count
CREATE OR REPLACE FUNCTION update_ai_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update message count
    NEW.message_count = jsonb_array_length(COALESCE(NEW.messages, '[]'::jsonb));

    -- Update last message timestamp
    NEW.last_message_at = NEW.updated_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stats updates
DROP TRIGGER IF EXISTS ai_chat_sessions_stats_trigger ON public.ai_chat_sessions;
CREATE TRIGGER ai_chat_sessions_stats_trigger
    BEFORE UPDATE ON public.ai_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_chat_session_stats();

-- Create function for session cleanup (remove empty sessions older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_empty_ai_chat_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.ai_chat_sessions
    WHERE
        message_count <= 1
        AND created_at < NOW() - INTERVAL '24 hours'
        AND is_active = false;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user session statistics
CREATE OR REPLACE FUNCTION get_user_ai_chat_stats(user_uuid UUID)
RETURNS TABLE (
    total_sessions INTEGER,
    active_sessions INTEGER,
    total_messages BIGINT,
    avg_messages_per_session NUMERIC,
    oldest_session TIMESTAMP WITH TIME ZONE,
    newest_session TIMESTAMP WITH TIME ZONE,
    most_active_day DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_sessions,
        COUNT(CASE WHEN is_active THEN 1 END)::INTEGER as active_sessions,
        COALESCE(SUM(message_count), 0) as total_messages,
        CASE
            WHEN COUNT(*) > 0 THEN ROUND(COALESCE(SUM(message_count), 0)::NUMERIC / COUNT(*), 2)
            ELSE 0
        END as avg_messages_per_session,
        MIN(created_at) as oldest_session,
        MAX(created_at) as newest_session,
        (
            SELECT DATE(created_at)
            FROM public.ai_chat_sessions
            WHERE user_id = user_uuid
            GROUP BY DATE(created_at)
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) as most_active_day
    FROM public.ai_chat_sessions
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to be more specific
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.ai_chat_sessions;

-- Create more granular RLS policies
CREATE POLICY "Users can view own chat sessions"
ON public.ai_chat_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
ON public.ai_chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
ON public.ai_chat_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
ON public.ai_chat_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE public.ai_chat_sessions IS 'Persistent storage for AI chat sessions with message history';
COMMENT ON COLUMN public.ai_chat_sessions.messages IS 'JSONB array of chat messages with role, content, and timestamp';
COMMENT ON COLUMN public.ai_chat_sessions.ai_model IS 'AI model/provider used for this session (e.g., vortex-router, gpt-4, gemini)';
COMMENT ON COLUMN public.ai_chat_sessions.is_active IS 'Flag indicating if session is currently active/in use';
COMMENT ON COLUMN public.ai_chat_sessions.last_message_at IS 'Timestamp of the last message in this session';
COMMENT ON COLUMN public.ai_chat_sessions.message_count IS 'Cached count of messages for performance';
COMMENT ON COLUMN public.ai_chat_sessions.session_metadata IS 'Additional session data (preferences, context, etc.)';

-- Create a view for active sessions with latest message preview
CREATE OR REPLACE VIEW active_ai_chat_sessions AS
SELECT
    id,
    user_id,
    session_name,
    ai_model,
    message_count,
    last_message_at,
    created_at,
    updated_at,
    CASE
        WHEN jsonb_array_length(messages) > 0 THEN
            messages->-1->>'content'
        ELSE null
    END as latest_message_preview,
    is_active
FROM public.ai_chat_sessions
WHERE is_active = true
ORDER BY last_message_at DESC;

-- Grant appropriate permissions to the view
GRANT SELECT ON active_ai_chat_sessions TO authenticated;
GRANT SELECT ON active_ai_chat_sessions TO anon;

-- Enable RLS on the view
ALTER VIEW active_ai_chat_sessions OWNER TO postgres;

COMMENT ON VIEW active_ai_chat_sessions IS 'View of active AI chat sessions with latest message previews';

-- Final optimization: Update table statistics
ANALYZE public.ai_chat_sessions;