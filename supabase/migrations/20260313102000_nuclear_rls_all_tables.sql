-- Nuclear fix: drop ALL existing policies on ALL tables, then recreate clean ones
-- This catches any policies from the original schema that had different names

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'categories', 'skills', 'settings', 'presets', 'schedule',
                      'documents', 'notifications', 'messages', 'resident_skills',
                      'timing_logs', 'log_comments', 'tuition', 'payments', 'contacts')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ═══ PROFILES ═══
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ CATEGORIES ═══
CREATE POLICY "allow_all_categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ SKILLS ═══
CREATE POLICY "allow_all_skills" ON skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ SETTINGS ═══
CREATE POLICY "allow_all_settings" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ PRESETS ═══
CREATE POLICY "allow_all_presets" ON presets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ SCHEDULE ═══
CREATE POLICY "allow_all_schedule" ON schedule FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ DOCUMENTS ═══
CREATE POLICY "allow_all_documents" ON documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ NOTIFICATIONS ═══
CREATE POLICY "allow_all_notifications" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ MESSAGES ═══
CREATE POLICY "allow_all_messages" ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ RESIDENT_SKILLS ═══
CREATE POLICY "allow_all_resident_skills" ON resident_skills FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ TIMING_LOGS ═══
CREATE POLICY "allow_all_timing_logs" ON timing_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ LOG_COMMENTS ═══
CREATE POLICY "allow_all_log_comments" ON log_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ TUITION ═══
CREATE POLICY "allow_all_tuition" ON tuition FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ PAYMENTS ═══
CREATE POLICY "allow_all_payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══ CONTACTS ═══
CREATE POLICY "allow_all_contacts" ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
