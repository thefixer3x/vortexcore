-- Initialize VortexCore Auth Database
-- This script creates the initial database structure and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create additional databases for other services
CREATE DATABASE vortex_accounts;
CREATE DATABASE vortex_transactions;
CREATE DATABASE vortex_payments;
CREATE DATABASE vortex_analytics;
CREATE DATABASE vortex_notifications;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE vortex_auth TO vortex_user;
GRANT ALL PRIVILEGES ON DATABASE vortex_accounts TO vortex_user;
GRANT ALL PRIVILEGES ON DATABASE vortex_transactions TO vortex_user;
GRANT ALL PRIVILEGES ON DATABASE vortex_payments TO vortex_user;
GRANT ALL PRIVILEGES ON DATABASE vortex_analytics TO vortex_user;
GRANT ALL PRIVILEGES ON DATABASE vortex_notifications TO vortex_user;

-- Create read-only user for analytics
CREATE USER vortex_readonly WITH PASSWORD 'vortex_readonly_password';
GRANT CONNECT ON DATABASE vortex_auth TO vortex_readonly;
GRANT CONNECT ON DATABASE vortex_accounts TO vortex_readonly;
GRANT CONNECT ON DATABASE vortex_transactions TO vortex_readonly;
GRANT CONNECT ON DATABASE vortex_payments TO vortex_readonly;
GRANT CONNECT ON DATABASE vortex_analytics TO vortex_readonly;
GRANT CONNECT ON DATABASE vortex_notifications TO vortex_readonly;

-- Switch to auth database for additional setup
\c vortex_auth;

-- Grant schema permissions
GRANT USAGE ON SCHEMA public TO vortex_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO vortex_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO vortex_readonly;

-- Create performance indexes (these will be created by Prisma as well, but we're being explicit)
-- These indexes are for common query patterns

-- User lookup indexes
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id) WHERE is_revoked = false;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_revoked = false;
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token) WHERE is_revoked = false;

-- Login attempts indexes for security monitoring
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_failed ON login_attempts(created_at) WHERE success = false;

-- MFA indexes
CREATE INDEX IF NOT EXISTS idx_mfa_settings_enabled ON user_mfa_settings(user_id) WHERE is_enabled = true;

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time ON audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_time ON audit_logs(resource, created_at);

-- Verification token indexes
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at) WHERE used_at IS NULL;

-- Password reset indexes
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token) WHERE used_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at) WHERE used_at IS NULL;

-- Create materialized view for user statistics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as registration_date,
    COUNT(*) as new_users,
    COUNT(*) FILTER (WHERE is_verified = true) as verified_users,
    COUNT(*) FILTER (WHERE last_login_at IS NOT NULL) as active_users
FROM users 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY registration_date;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_date ON user_stats(registration_date);

-- Create function to refresh user stats
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old login attempts (keep for 90 days for security analysis)
    DELETE FROM login_attempts 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Clean up used verification tokens (keep for 30 days)
    DELETE FROM email_verifications 
    WHERE used_at IS NOT NULL AND used_at < NOW() - INTERVAL '30 days';
    
    -- Clean up used password reset tokens (keep for 30 days)
    DELETE FROM password_resets 
    WHERE used_at IS NOT NULL AND used_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old audit logs (keep for 1 year)
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment the database
COMMENT ON DATABASE vortex_auth IS 'VortexCore Authentication Service Database';

-- Comment the tables (will be overridden by Prisma, but good for documentation)
COMMENT ON TABLE users IS 'Core user accounts and authentication data';
COMMENT ON TABLE user_sessions IS 'Active user sessions with refresh tokens';
COMMENT ON TABLE user_mfa_settings IS 'Multi-factor authentication settings per user';
COMMENT ON TABLE login_attempts IS 'Security log of all login attempts';
COMMENT ON TABLE email_verifications IS 'Email verification tokens';
COMMENT ON TABLE password_resets IS 'Password reset tokens';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all user actions';

-- Success message
SELECT 'VortexCore Auth Database initialized successfully!' as status;
