-- Migration: Add indexes for message queries optimization
-- Requirements: 1.1, 2.1, 4.1
-- Purpose: Optimize conversation aggregation and unread count queries

-- Index for sender queries (used in conversation aggregation)
CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
ON messages(sender_id, created_at DESC);

-- Index for recipient queries (used in conversation aggregation)
CREATE INDEX IF NOT EXISTS idx_messages_recipient_created 
ON messages(recipient_id, created_at DESC);

-- Index for unread message queries (used in unread count calculation)
CREATE INDEX IF NOT EXISTS idx_messages_recipient_read 
ON messages(recipient_id, read) 
WHERE read = false;

-- Composite index for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON messages(sender_id, recipient_id, created_at DESC);

-- Comment explaining the indexes
COMMENT ON INDEX idx_messages_sender_created IS 'Optimizes queries for messages sent by a user, sorted by creation time';
COMMENT ON INDEX idx_messages_recipient_created IS 'Optimizes queries for messages received by a user, sorted by creation time';
COMMENT ON INDEX idx_messages_recipient_read IS 'Optimizes queries for unread messages received by a user';
COMMENT ON INDEX idx_messages_conversation IS 'Optimizes queries for conversations between two users';
