# Manual Dashboard Fixes for Supabase Performance

## 1. Update Connection Pooling Settings

To access your Supabase project dashboard:
1. Go to: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/settings/database
2. Find the "Connection pooling" section
3. Update the following settings:

### Connection Pooling Configuration:
- **Pool Mode**: Set to `transaction` (reduces connection overhead)
- **Pool Size**: Adjust based on your application's needs (typically 20-50)
- **Pool Timeout**: Set to 30 seconds
- **Max Client Connections**: Reduce if currently set too high

## 2. Run Extension Update Script

Execute the SQL commands in `APPLY_THIS_IN_SUPABASE_DASHBOARD.sql` in your Supabase SQL Editor:
1. Go to: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/database/sql
2. Copy and paste the contents of `APPLY_THIS_IN_SUPABASE_DASHBOARD.sql`
3. Run the script to update your extensions

## 3. Check and Optimize Realtime Settings

To reduce the load from `realtime.list_changes` queries:
1. Go to: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/database/realtime
2. Review your active subscriptions
3. Ensure you're using specific filters rather than subscribing to entire tables

## 4. Enable Query Performance Insights

To monitor your improvements:
1. Go to: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/database/query-performance
2. Enable query performance insights if not already active
3. Set up alerts for:
   - Queries taking longer than 1 second
   - High connection counts
   - CPU usage above 80%

## 5. Run Performance Benchmark Queries

After implementing changes, run these queries to measure improvement:

```sql
-- Reset statistics
SELECT pg_stat_statements_reset();

-- After running your app for a while, check performance
SELECT 
  rolname,
  query,
  calls,
  mean_time,
  prop_total_time
FROM pg_stat_statements 
JOIN pg_authid ON userid = pg_authid.oid
ORDER BY total_exec_time + total_plan_time DESC
LIMIT 20;
```

## 6. Review Additional Optimizations

Check for any tables that might benefit from additional indexes:

```sql
-- Find tables that might need indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

## 7. Monitor for Additional Indexes

Based on your schema, consider these additional indexes if not already present:

```sql
-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON public.transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_status ON public.transactions(created_at, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_time ON public.chat_messages(conversation_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_virtual_cards_user_status ON public.virtual_cards(user_id, status);