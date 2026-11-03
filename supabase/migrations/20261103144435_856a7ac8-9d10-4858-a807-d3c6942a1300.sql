CREATE POLICY "Server only - no client access" ON control_room.audit_log
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);