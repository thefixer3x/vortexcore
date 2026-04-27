# 🚀 Supabase Performance Optimization Guide

## 📊 Current Performance Analysis

### **Key Findings:**
- ✅ Cache hit rates are excellent (96-100%)
- ⚠️ Timezone query consuming 20% of query time
- ⚠️ Extension migration queries running frequently
- ℹ️ Most expensive queries are system/metadata, not application queries

---

## 🎯 **Immediate Optimizations**

### **1. Update Supabase Extensions (5 minutes)**

Your extensions are outdated and running migration checks on every connection.

**Go to Supabase Dashboard:**
https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/database/extensions

**Update these extensions:**
```sql
-- Check current versions
SELECT name, installed_version, default_version 
FROM pg_available_extensions 
WHERE installed_version != default_version;

-- Update extensions
ALTER EXTENSION wrappers UPDATE TO '0.4.5';
ALTER EXTENSION supabase_vault UPDATE TO '0.3.0';
ALTER EXTENSION pg_graphql UPDATE TO latest;
```

**Expected Impact:** Reduce ~10% of query overhead

---

### **2. Optimize PostgREST Connection Pooling**

The timezone query runs on every new PostgREST connection.

**In Supabase Dashboard:**
https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/settings/database

**Settings to adjust:**
- **Pool Mode**: Set to `transaction` (reduces connections)
- **Connection Pooling**: Enable PgBouncer if not already
- **Max Client Connections**: Reduce if set too high

**Expected Impact:** Reduce ~15% of metadata queries

---

### **3. Disable Unused Extensions**

Extensions run checks even when not used.

**Check what you're using:**
```sql
-- See all enabled extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname NOT IN ('plpgsql');
```

**Disable unused ones:**
```sql
-- Only if you're NOT using these features
DROP EXTENSION IF EXISTS wrappers CASCADE;  -- Only if not using foreign data wrappers
DROP EXTENSION IF EXISTS pg_graphql CASCADE; -- Only if not using GraphQL
```

**⚠️ WARNING:** Only disable if you're certain you're not using them!

---

### **4. Add Missing Indexes (if applicable)**

Review your actual application queries:

```sql
-- Find queries without index suggestions
SELECT 
  query,
  calls,
  mean_time,
  (SELECT index_advisor(query))
FROM pg_stat_statements 
WHERE query LIKE 'SELECT%FROM public.%'
ORDER BY mean_time DESC 
LIMIT 20;
```

---

## 📈 **Application-Level Optimizations**

### **1. Enable Statement Caching in Your App**

In your Supabase client configuration:

```typescript
// src/lib/supabase.ts or similar
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        // Enable statement caching
        'x-supabase-cache-control': 'max-age=60',
      },
    },
  }
);
```

---

### **2. Use Supabase Realtime Wisely**

The `realtime.list_changes` query (if still present) can be expensive.

**Optimize subscriptions:**
```typescript
// ❌ Bad: Subscribe to entire table
const subscription = supabase
  .from('users')
  .on('*', payload => {})
  .subscribe();

// ✅ Good: Subscribe to specific rows
const subscription = supabase
  .from('users')
  .on('UPDATE', payload => {})
  .eq('id', userId)  // Only for specific user
  .subscribe();
```

---

### **3. Implement Query Batching**

Instead of multiple small queries:

```typescript
// ❌ Bad: Multiple queries
const user = await supabase.from('users').select('*').eq('id', userId);
const profile = await supabase.from('profiles').select('*').eq('user_id', userId);
const wallet = await supabase.from('wallets').select('*').eq('user_id', userId);

// ✅ Good: Single query with joins
const data = await supabase
  .from('users')
  .select(`
    *,
    profiles (*),
    wallets (*)
  `)
  .eq('id', userId)
  .single();
```

---

### **4. Add Redis Caching Layer (Optional)**

For frequently accessed data:

```typescript
// Example with Upstash Redis
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

async function getUserWithCache(userId: string) {
  // Try cache first
  const cached = await redis.get(`user:${userId}`);
  if (cached) return cached;

  // Fallback to database
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // Cache for 5 minutes
  await redis.setex(`user:${userId}`, 300, JSON.stringify(data));
  
  return data;
}
```

---

## 🔍 **Monitoring & Debugging**

### **1. Enable Query Performance Insights**

In Supabase Dashboard:
https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole/database/query-performance

**Watch for:**
- Queries with high `mean_time`
- Queries with low `cache_hit_rate`
- Queries called frequently (`calls`)

---

### **2. Add Application-Level Logging**

Track slow queries in your app:

```typescript
// Middleware to log slow queries
const logSlowQueries = async (query: Promise<any>, queryName: string) => {
  const start = Date.now();
  const result = await query;
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    // Send to monitoring service (Sentry, LogRocket, etc.)
  }

  return result;
};

// Usage
const data = await logSlowQueries(
  supabase.from('users').select('*'),
  'fetch_users'
);
```

---

### **3. Set Up Alerts**

Configure alerts for:
- Database CPU > 80%
- Connection pool exhaustion
- Query time > 5 seconds
- Disk usage > 80%

---

## 📊 **Benchmark Your Changes**

### **Before Optimization:**
Run the expensive queries analysis:
```sql
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

### **After Each Optimization:**
1. Reset stats: `SELECT pg_stat_statements_reset();`
2. Run your app normally for 1 hour
3. Re-run the analysis query
4. Compare results

---

## 🎯 **Expected Results**

After implementing all optimizations:

| Metric | Before | Target |
|--------|--------|--------|
| Avg Query Time | ~50-200ms | <50ms |
| P95 Query Time | ~500ms | <200ms |
| Cache Hit Rate | 96-99% | >99% |
| Connection Count | Variable | Stable & Low |
| CPU Usage | Variable | <50% avg |

---

## 🚨 **Red Flags to Watch**

### **Performance Degrading?**
- Check for missing indexes
- Look for N+1 query problems
- Monitor table bloat
- Check for long-running transactions

### **Connection Issues?**
- Review connection pool settings
- Check for connection leaks in app
- Monitor `pg_stat_activity`

### **Slow Queries Appearing?**
```sql
-- Find slow queries right now
SELECT 
  pid,
  now() - query_start as duration,
  state,
  query 
FROM pg_stat_activity 
WHERE state = 'active'
  AND now() - query_start > interval '5 seconds'
ORDER BY duration DESC;
```

---

## 🔄 **Regular Maintenance**

### **Weekly:**
- Review query performance stats
- Check for new slow queries
- Monitor disk usage

### **Monthly:**
- Run `VACUUM ANALYZE` on large tables
- Review and update indexes
- Check extension updates

### **Quarterly:**
- Review and optimize RLS policies
- Audit unused tables/columns
- Plan for scaling needs

---

## 📞 **Need More Help?**

- **Supabase Docs**: https://supabase.com/docs/guides/database/performance
- **Query Optimization**: https://supabase.com/docs/guides/database/query-performance
- **Connection Pooling**: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool

---

## ✅ **Quick Action Checklist**

Priority optimizations to do NOW:

- [ ] Update extensions (wrappers, vault, graphql)
- [ ] Enable transaction-mode connection pooling
- [ ] Review and optimize your most frequent queries
- [ ] Add statement caching in app
- [ ] Optimize real-time subscriptions
- [ ] Set up performance monitoring alerts

**After completing these, run the benchmark query again to measure improvement!**
