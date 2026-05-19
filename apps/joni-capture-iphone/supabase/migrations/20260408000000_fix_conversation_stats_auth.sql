-- Migration: Fix IDOR in get_conversation_with_stats
-- Description: Add auth.uid() check to prevent users from reading other users' conversations
-- Security: CRIT-01 - The function was SECURITY DEFINER with no user_id filter,
--           allowing any authenticated user to query any conversation by UUID.

CREATE OR REPLACE FUNCTION get_conversation_with_stats(conversation_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    persona_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    message_count BIGINT,
    last_message_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.user_id,
        c.title,
        c.persona_name,
        c.created_at,
        c.updated_at,
        COUNT(m.id) as message_count,
        MAX(m.timestamp) as last_message_at
    FROM conversations c
    LEFT JOIN messages m ON c.id = m.conversation_id
    WHERE c.id = conversation_uuid
      AND c.user_id = auth.uid()
    GROUP BY c.id, c.user_id, c.title, c.persona_name, c.created_at, c.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
