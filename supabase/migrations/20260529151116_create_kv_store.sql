-- Migration: Create KV Store Table for Edge Functions
-- Date: 2026-05-29 15:11:16
-- Purpose: Central key-value storage for all Edge Functions (OAuth state, credentials, caches, etc.)

CREATE TABLE IF NOT EXISTS kv_store_7d87310d (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable Row-Level Security
ALTER TABLE kv_store_7d87310d ENABLE ROW LEVEL SECURITY;

-- Create index for text pattern queries (used by getByPrefix operations)
CREATE INDEX ON kv_store_7d87310d (key text_pattern_ops);

-- RLS Policies (recommended)
-- Deny all direct client access (only Edge Functions with service role can read/write)
CREATE POLICY "no_public_access" ON kv_store_7d87310d
  FOR ALL
  USING (false);

-- Allow authenticated reads only if explicitly needed (consider keeping this commented unless required)
-- CREATE POLICY "authenticated_read_public_keys" ON kv_store_7d87310d
--   FOR SELECT
--   TO authenticated
--   USING (key LIKE 'public_%' OR key LIKE 'user_' || auth.uid() || '%');
