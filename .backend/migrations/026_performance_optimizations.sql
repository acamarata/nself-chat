-- ============================================================================
-- Migration 026: Performance Optimizations for 10,000 Concurrent Users
-- ============================================================================
-- Description: Comprehensive database optimizations including indexes,
--              partitioning, materialized views, and query optimizations
-- Version: v0.5.0
-- Created: 2026-01-30
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. INDEXES FOR QUERY OPTIMIZATION
-- ============================================================================

-- Messages table indexes (most frequently queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_channel_created
  ON nchat_messages(channel_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_user_created
  ON nchat_messages(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_thread
  ON nchat_messages(thread_id, created_at DESC)
  WHERE thread_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_parent
  ON nchat_messages(parent_id)
  WHERE parent_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_search
  ON nchat_messages USING gin(to_tsvector('english', content))
  WHERE deleted_at IS NULL;

-- Channels table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channels_type_active
  ON nchat_channels(type, is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channels_visibility
  ON nchat_channels(visibility)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channels_created
  ON nchat_channels(created_at DESC);

-- Channel members table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_members_user
  ON nchat_channel_members(user_id, joined_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_members_channel
  ON nchat_channel_members(channel_id, joined_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channel_members_active
  ON nchat_channel_members(channel_id, user_id)
  WHERE left_at IS NULL;

-- Direct messages table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dms_participants
  ON nchat_direct_messages USING gin(participant_ids);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dms_created
  ON nchat_direct_messages(created_at DESC);

-- Reactions table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reactions_message
  ON nchat_reactions(message_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reactions_user
  ON nchat_reactions(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reactions_emoji
  ON nchat_reactions(emoji, message_id);

-- Attachments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_message
  ON nchat_attachments(message_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_type
  ON nchat_attachments(file_type, created_at DESC);

-- Notifications table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
  ON nchat_notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type
  ON nchat_notifications(notification_type, created_at DESC);

-- User presence indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_presence_status
  ON nchat_user_presence(user_id, status, last_seen_at DESC);

-- Typing indicators indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_typing_channel_active
  ON nchat_typing_indicators(channel_id, expires_at)
  WHERE expires_at > NOW();

-- Read receipts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_read_receipts_user_channel
  ON nchat_read_receipts(user_id, channel_id, read_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_read_receipts_message
  ON nchat_read_receipts(message_id, user_id);

-- E2EE key bundles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_e2ee_bundles_user_device
  ON nchat_e2ee_key_bundles(user_id, device_id)
  WHERE deleted_at IS NULL;

-- E2EE sessions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_e2ee_sessions_users
  ON nchat_e2ee_sessions(sender_user_id, recipient_user_id);

-- Audit logs indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action
  ON nchat_audit_logs(user_id, action, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource
  ON nchat_audit_logs(resource_type, resource_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created
  ON nchat_audit_logs(created_at DESC);

-- ============================================================================
-- 2. TABLE PARTITIONING FOR LARGE TABLES
-- ============================================================================

-- Partition messages table by month (for scalability)
-- Note: This requires data migration if table already has data

-- Create partitioned messages table
CREATE TABLE IF NOT EXISTS nchat_messages_partitioned (
  id UUID DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT,
  message_type VARCHAR(50) DEFAULT 'text',
  parent_id UUID,
  thread_id UUID,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for the past 3 months and future 3 months
CREATE TABLE IF NOT EXISTS nchat_messages_2025_11 PARTITION OF nchat_messages_partitioned
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS nchat_messages_2025_12 PARTITION OF nchat_messages_partitioned
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS nchat_messages_2026_01 PARTITION OF nchat_messages_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS nchat_messages_2026_02 PARTITION OF nchat_messages_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS nchat_messages_2026_03 PARTITION OF nchat_messages_partitioned
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS nchat_messages_2026_04 PARTITION OF nchat_messages_partitioned
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- Partition audit logs by month
CREATE TABLE IF NOT EXISTS nchat_audit_logs_partitioned (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for audit logs
CREATE TABLE IF NOT EXISTS nchat_audit_logs_2025_11 PARTITION OF nchat_audit_logs_partitioned
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE IF NOT EXISTS nchat_audit_logs_2025_12 PARTITION OF nchat_audit_logs_partitioned
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE IF NOT EXISTS nchat_audit_logs_2026_01 PARTITION OF nchat_audit_logs_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS nchat_audit_logs_2026_02 PARTITION OF nchat_audit_logs_partitioned
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS nchat_audit_logs_2026_03 PARTITION OF nchat_audit_logs_partitioned
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS nchat_audit_logs_2026_04 PARTITION OF nchat_audit_logs_partitioned
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

-- ============================================================================
-- 3. MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- Channel statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS nchat_channel_stats AS
SELECT
  c.id AS channel_id,
  c.name AS channel_name,
  c.type AS channel_type,
  COUNT(DISTINCT cm.user_id) AS member_count,
  COUNT(DISTINCT m.id) AS message_count,
  COUNT(DISTINCT CASE WHEN m.created_at >= NOW() - INTERVAL '24 hours' THEN m.id END) AS messages_last_24h,
  COUNT(DISTINCT CASE WHEN m.created_at >= NOW() - INTERVAL '7 days' THEN m.id END) AS messages_last_7d,
  MAX(m.created_at) AS last_message_at,
  c.created_at
FROM nchat_channels c
LEFT JOIN nchat_channel_members cm ON c.id = cm.channel_id AND cm.left_at IS NULL
LEFT JOIN nchat_messages m ON c.id = m.channel_id AND m.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.name, c.type, c.created_at;

-- Create indexes on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_stats_channel_id ON nchat_channel_stats(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_stats_message_count ON nchat_channel_stats(message_count DESC);
CREATE INDEX IF NOT EXISTS idx_channel_stats_member_count ON nchat_channel_stats(member_count DESC);

-- User activity materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS nchat_user_activity_stats AS
SELECT
  u.id AS user_id,
  u.display_name,
  COUNT(DISTINCT m.id) AS message_count,
  COUNT(DISTINCT m.channel_id) AS channels_participated,
  COUNT(DISTINCT r.id) AS reaction_count,
  COUNT(DISTINCT CASE WHEN m.created_at >= NOW() - INTERVAL '24 hours' THEN m.id END) AS messages_last_24h,
  COUNT(DISTINCT CASE WHEN m.created_at >= NOW() - INTERVAL '7 days' THEN m.id END) AS messages_last_7d,
  MAX(m.created_at) AS last_message_at,
  u.created_at
FROM auth.users u
LEFT JOIN nchat_messages m ON u.id = m.user_id AND m.deleted_at IS NULL
LEFT JOIN nchat_reactions r ON u.id = r.user_id
GROUP BY u.id, u.display_name, u.created_at;

-- Create indexes on user activity view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_user_id ON nchat_user_activity_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_message_count ON nchat_user_activity_stats(message_count DESC);

-- Message engagement materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS nchat_message_engagement_stats AS
SELECT
  m.id AS message_id,
  m.channel_id,
  m.user_id,
  COUNT(DISTINCT r.id) AS reaction_count,
  COUNT(DISTINCT CASE WHEN replies.parent_id = m.id THEN replies.id END) AS reply_count,
  COUNT(DISTINCT a.id) AS attachment_count,
  m.created_at
FROM nchat_messages m
LEFT JOIN nchat_reactions r ON m.id = r.message_id
LEFT JOIN nchat_messages replies ON m.id = replies.parent_id AND replies.deleted_at IS NULL
LEFT JOIN nchat_attachments a ON m.id = a.message_id
WHERE m.deleted_at IS NULL
GROUP BY m.id, m.channel_id, m.user_id, m.created_at;

-- Create indexes on message engagement view
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_engagement_message_id ON nchat_message_engagement_stats(message_id);
CREATE INDEX IF NOT EXISTS idx_message_engagement_reaction_count ON nchat_message_engagement_stats(reaction_count DESC);

-- ============================================================================
-- 4. FUNCTIONS FOR MATERIALIZED VIEW REFRESH
-- ============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY nchat_channel_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY nchat_user_activity_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY nchat_message_engagement_stats;
END;
$$;

-- Schedule materialized view refresh (requires pg_cron extension)
-- Note: Uncomment if pg_cron is available
-- SELECT cron.schedule('refresh-stats', '*/15 * * * *', 'SELECT refresh_all_materialized_views()');

-- ============================================================================
-- 5. QUERY OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Optimized function to get recent messages with reactions
CREATE OR REPLACE FUNCTION get_recent_messages_optimized(
  p_channel_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  channel_id UUID,
  user_id UUID,
  content TEXT,
  message_type VARCHAR,
  parent_id UUID,
  thread_id UUID,
  is_edited BOOLEAN,
  created_at TIMESTAMPTZ,
  reaction_count BIGINT,
  reply_count BIGINT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.channel_id,
    m.user_id,
    m.content,
    m.message_type,
    m.parent_id,
    m.thread_id,
    m.is_edited,
    m.created_at,
    COUNT(DISTINCT r.id) AS reaction_count,
    COUNT(DISTINCT replies.id) AS reply_count
  FROM nchat_messages m
  LEFT JOIN nchat_reactions r ON m.id = r.message_id
  LEFT JOIN nchat_messages replies ON m.id = replies.parent_id AND replies.deleted_at IS NULL
  WHERE m.channel_id = p_channel_id
    AND m.deleted_at IS NULL
  GROUP BY m.id
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Optimized function to get channel unread count
CREATE OR REPLACE FUNCTION get_channel_unread_count(
  p_user_id UUID,
  p_channel_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_last_read_at TIMESTAMPTZ;
  v_unread_count INTEGER;
BEGIN
  -- Get last read timestamp
  SELECT read_at INTO v_last_read_at
  FROM nchat_read_receipts
  WHERE user_id = p_user_id
    AND channel_id = p_channel_id
  ORDER BY read_at DESC
  LIMIT 1;

  -- If never read, count all messages
  IF v_last_read_at IS NULL THEN
    SELECT COUNT(*)::INTEGER INTO v_unread_count
    FROM nchat_messages
    WHERE channel_id = p_channel_id
      AND deleted_at IS NULL;
  ELSE
    -- Count messages after last read
    SELECT COUNT(*)::INTEGER INTO v_unread_count
    FROM nchat_messages
    WHERE channel_id = p_channel_id
      AND created_at > v_last_read_at
      AND deleted_at IS NULL;
  END IF;

  RETURN COALESCE(v_unread_count, 0);
END;
$$;

-- ============================================================================
-- 6. CONNECTION POOLING SETTINGS
-- ============================================================================

-- Optimize PostgreSQL settings for high concurrency
-- Note: These should be set in postgresql.conf or via ALTER SYSTEM

COMMENT ON DATABASE postgres IS 'Recommended settings for 10,000 concurrent users:
max_connections = 200 (use PgBouncer for connection pooling)
shared_buffers = 4GB (25% of RAM)
effective_cache_size = 12GB (75% of RAM)
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1 (for SSD)
effective_io_concurrency = 200 (for SSD)
work_mem = 20MB (adjust based on max_connections)
min_wal_size = 2GB
max_wal_size = 8GB
max_worker_processes = 8
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4';

-- ============================================================================
-- 7. VACUUM AND ANALYZE OPTIMIZATION
-- ============================================================================

-- Update autovacuum settings for high-traffic tables
ALTER TABLE nchat_messages SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE nchat_reactions SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE nchat_notifications SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE nchat_audit_logs SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

-- ============================================================================
-- 8. CACHE TABLE FOR FREQUENTLY ACCESSED DATA
-- ============================================================================

-- Create cache table for online users count
CREATE TABLE IF NOT EXISTS nchat_cache_online_users (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO nchat_cache_online_users (id, count) VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Function to update online users cache
CREATE OR REPLACE FUNCTION update_online_users_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id)::INTEGER INTO v_count
  FROM nchat_user_presence
  WHERE status = 'online'
    AND last_seen_at > NOW() - INTERVAL '5 minutes';

  UPDATE nchat_cache_online_users
  SET count = v_count, updated_at = NOW()
  WHERE id = 1;
END;
$$;

-- ============================================================================
-- 9. STATISTICS AND ANALYSIS
-- ============================================================================

-- Analyze all tables to update query planner statistics
ANALYZE nchat_messages;
ANALYZE nchat_channels;
ANALYZE nchat_channel_members;
ANALYZE nchat_reactions;
ANALYZE nchat_attachments;
ANALYZE nchat_notifications;
ANALYZE nchat_direct_messages;
ANALYZE nchat_user_presence;
ANALYZE nchat_read_receipts;
ANALYZE nchat_audit_logs;

-- ============================================================================
-- 10. GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant usage on materialized views
GRANT SELECT ON nchat_channel_stats TO authenticated;
GRANT SELECT ON nchat_user_activity_stats TO authenticated;
GRANT SELECT ON nchat_message_engagement_stats TO authenticated;

-- Grant execute on optimization functions
GRANT EXECUTE ON FUNCTION get_recent_messages_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_channel_unread_count TO authenticated;
GRANT EXECUTE ON FUNCTION update_online_users_cache TO authenticated;

COMMIT;

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================
-- 1. Run CONCURRENTLY index creation outside transaction if needed
-- 2. Partition migration requires careful planning for existing data
-- 3. Refresh materialized views regularly (every 15 minutes recommended)
-- 4. Monitor query performance with pg_stat_statements extension
-- 5. Use PgBouncer for connection pooling (separate configuration)
-- 6. Consider read replicas for read-heavy workloads
-- 7. Enable pg_stat_statements for query analysis
-- 8. Monitor cache hit ratio and adjust shared_buffers accordingly
-- ============================================================================
