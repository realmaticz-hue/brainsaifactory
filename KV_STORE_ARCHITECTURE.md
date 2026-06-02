# KV Store Architecture Reference

**Last Updated:** 2026-06-01  
**Table:** `kv_store_7d87310d`  
**Type:** Central key-value store for Edge Functions (Supabase service-role access)

---

## Table Schema

```sql
CREATE TABLE kv_store_7d87310d (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

ALTER TABLE kv_store_7d87310d ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON kv_store_7d87310d (key text_pattern_ops);
```

**Columns:**
- `key` (TEXT, PRIMARY KEY): Unique identifier for stored data
- `value` (JSONB): Arbitrary JSON data; stores credentials, state, cache, metadata

**RLS Status:** ✅ Enabled (policies deny direct client access by default)

---

## Access Patterns

All KV operations go through **`src/app/supabase/functions/server/kv_store.tsx`** which exposes:

| Operation | Function | Example |
|-----------|----------|---------|
| Single write | `set(key, value)` | `await kv.set('oauth_state_xyz', {...})` |
| Single read | `get(key)` | `await kv.get('social_credentials')` |
| Single delete | `del(key)` | `await kv.del('oauth_relay_state')` |
| Batch write | `mset(keys[], values[])` | Bulk upsert multiple KV pairs |
| Batch read | `mget(keys[])` | Bulk fetch by keys |
| Batch delete | `mdel(keys[])` | Bulk delete |
| Prefix search | `getByPrefix(prefix)` | `await kv.getByPrefix('factory-project:')` |

---

## Key Namespaces & Domains

### OAuth & Credentials
- `oauth_creds_<platform>` → Encrypted OAuth app credentials (clientId, clientSecret)
- `oauth_state_<state>` → OAuth state parameter tracking (platform, timestamp, redirectUri)
- `oauth_relay_<state>` → Relay polling results (code, state, error) for popup-based OAuth
- `social_credentials` → Aggregated social platform credentials (Facebook, Instagram, etc.)
- `social-credentials-facebook` → Facebook-specific app secret & token data

### Social Accounts & Audit
- `social_accounts` → List of connected accounts (platforms, tokens, status, metadata)
- `social_audit_logs` → Audit trail of account operations (capped at 100 entries)

### Genius Chat
- `genius-memory-<sessionId>` → Conversation memory entries per session
- `genius-profile-<sessionId>` → User profile data per session
- `genius-corrections` → Saved corrections/feedback

### Software Factory & Templates
- `factory-project:<projectId>` → Saved project metadata & code state
- `factory-build:<buildId>` → Build record (timestamp, success, logs, agent metrics)
- `factory-agent-metric:<id>` → Agent performance metrics
- `factory-insight:<i>` → Generated insights & learning data
- `template:<id>` → Saved app templates (with usage count, ratings, category)
- `favorites` → User favorites (list of project/build IDs)

### Knowledge Graph
- `kg:<node-key>` → Knowledge graph nodes (repair strategies, error patterns)
- `KG_STATS` → Aggregate knowledge graph statistics

### Cache & Misc
- `scrape_cache:<key>` → Cached web scraping results (TTL-managed cleanup)
- `kv-*` or `repo-*` keys → Git repair state & analysis caches

---

## Security & RLS Policies

### Current Policy
```sql
CREATE POLICY "no_public_access" ON kv_store_7d87310d
  FOR ALL
  USING (false);
```
**Effect:** Denies all direct client access. Only Edge Functions with `SUPABASE_SERVICE_ROLE_KEY` can read/write.

### Rationale
- **Credentials & tokens** must never be accessible to anonymous/authenticated users
- **State data** (OAuth relay, session state) should only be managed server-side
- **Client reads** should go through explicit, sanitized API endpoints (not direct DB access)

### Recommended Extensions (if needed)
For public/non-sensitive data, add a policy:
```sql
CREATE POLICY "read_public_keys" ON kv_store_7d87310d
  FOR SELECT
  TO authenticated
  USING (key LIKE 'public_%');
```

---

## Endpoints → KV Mapping

See `endpoint_kv_mapping.json` for the complete route-to-KV reference.

**Example:**
- `POST /make-server-7d87310d/social-credentials` → writes `social_credentials`
- `POST /make-server-7d87310d/social-accounts/oauth/relay-store` → writes `oauth_relay_<state>`
- `GET /make-server-7d87310d/factory/projects` → reads `factory-project:*` via `getByPrefix()`

---

## Deployment Checklist

- [ ] Migration `20260529151116_create_kv_store.sql` applied to remote Supabase project
- [ ] RLS enabled on `kv_store_7d87310d`
- [ ] Index on `(key text_pattern_ops)` created
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in Edge Function secrets
- [ ] No direct client-side Supabase writes to this table (all writes via Edge Functions)
- [ ] Audit logging for sensitive operations (OAuth, credentials) enabled
- [ ] Cleanup jobs (TTL, retention policies) configured where needed

---

## Performance Notes

- **Key lookup:** O(1) primary key query; text_pattern_ops index supports LIKE queries efficiently
- **Bulk operations:** Use `mset()`, `mget()`, `mdel()` for batches > 5 items
- **Prefix search:** `getByPrefix()` iterates all rows with matching prefix; consider pagination for large datasets
- **JSONB benefits:** Flexible schema, supports nested structures, queryable via SQL if needed

---

## Related Files

- Schema & migrations: `supabase/migrations/20260529151116_create_kv_store.sql`
- KV helper implementation: `src/app/supabase/functions/server/kv_store.tsx`
- Server routes: `src/app/supabase/functions/server/index.tsx` (routes that call kv.*)
- Endpoint mapping: `endpoint_kv_mapping.json`
