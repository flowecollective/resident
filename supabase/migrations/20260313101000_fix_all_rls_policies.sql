-- Ensure RLS is enabled and policies exist for all tables
-- This is idempotent — uses DROP IF EXISTS + CREATE

-- ═══ PRESETS ═══
ALTER TABLE IF EXISTS presets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "presets_select" ON presets;
DROP POLICY IF EXISTS "presets_insert" ON presets;
DROP POLICY IF EXISTS "presets_update" ON presets;
DROP POLICY IF EXISTS "presets_delete" ON presets;
CREATE POLICY "presets_select" ON presets FOR SELECT TO authenticated USING (true);
CREATE POLICY "presets_insert" ON presets FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "presets_update" ON presets FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "presets_delete" ON presets FOR DELETE TO authenticated USING (is_admin());

-- ═══ SCHEDULE ═══
ALTER TABLE IF EXISTS schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedule_select" ON schedule;
DROP POLICY IF EXISTS "schedule_insert" ON schedule;
DROP POLICY IF EXISTS "schedule_update" ON schedule;
DROP POLICY IF EXISTS "schedule_delete" ON schedule;
CREATE POLICY "schedule_select" ON schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedule_insert" ON schedule FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "schedule_update" ON schedule FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "schedule_delete" ON schedule FOR DELETE TO authenticated USING (is_admin());

-- ═══ DOCUMENTS ═══
ALTER TABLE IF EXISTS documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_select" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;
CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "documents_update" ON documents FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated USING (is_admin());

-- ═══ NOTIFICATIONS ═══
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (true);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated USING (is_admin());

-- ═══ MESSAGES ═══
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
DROP POLICY IF EXISTS "messages_delete" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "messages_delete" ON messages FOR DELETE TO authenticated USING (is_admin());

-- ═══ RESIDENT_SKILLS ═══
ALTER TABLE IF EXISTS resident_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resident_skills_select" ON resident_skills;
DROP POLICY IF EXISTS "resident_skills_insert" ON resident_skills;
DROP POLICY IF EXISTS "resident_skills_update" ON resident_skills;
DROP POLICY IF EXISTS "resident_skills_delete" ON resident_skills;
CREATE POLICY "resident_skills_select" ON resident_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "resident_skills_insert" ON resident_skills FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "resident_skills_update" ON resident_skills FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "resident_skills_delete" ON resident_skills FOR DELETE TO authenticated USING (is_admin());

-- ═══ TIMING_LOGS ═══
ALTER TABLE IF EXISTS timing_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timing_logs_select" ON timing_logs;
DROP POLICY IF EXISTS "timing_logs_insert" ON timing_logs;
DROP POLICY IF EXISTS "timing_logs_update" ON timing_logs;
DROP POLICY IF EXISTS "timing_logs_delete" ON timing_logs;
CREATE POLICY "timing_logs_select" ON timing_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "timing_logs_insert" ON timing_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "timing_logs_update" ON timing_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "timing_logs_delete" ON timing_logs FOR DELETE TO authenticated USING (true);

-- ═══ LOG_COMMENTS ═══
ALTER TABLE IF EXISTS log_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "log_comments_select" ON log_comments;
DROP POLICY IF EXISTS "log_comments_insert" ON log_comments;
DROP POLICY IF EXISTS "log_comments_update" ON log_comments;
DROP POLICY IF EXISTS "log_comments_delete" ON log_comments;
CREATE POLICY "log_comments_select" ON log_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "log_comments_insert" ON log_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "log_comments_update" ON log_comments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "log_comments_delete" ON log_comments FOR DELETE TO authenticated USING (true);

-- ═══ TUITION ═══
ALTER TABLE IF EXISTS tuition ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tuition_select" ON tuition;
DROP POLICY IF EXISTS "tuition_insert" ON tuition;
DROP POLICY IF EXISTS "tuition_update" ON tuition;
DROP POLICY IF EXISTS "tuition_delete" ON tuition;
CREATE POLICY "tuition_select" ON tuition FOR SELECT TO authenticated USING (true);
CREATE POLICY "tuition_insert" ON tuition FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "tuition_update" ON tuition FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "tuition_delete" ON tuition FOR DELETE TO authenticated USING (is_admin());

-- ═══ PAYMENTS ═══
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;
CREATE POLICY "payments_select" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_insert" ON payments FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "payments_update" ON payments FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "payments_delete" ON payments FOR DELETE TO authenticated USING (is_admin());

-- ═══ CONTACTS ═══
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_select" ON contacts;
DROP POLICY IF EXISTS "contacts_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_update" ON contacts;
DROP POLICY IF EXISTS "contacts_delete" ON contacts;
CREATE POLICY "contacts_select" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contacts_insert" ON contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contacts_update" ON contacts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "contacts_delete" ON contacts FOR DELETE TO authenticated USING (is_admin());

-- ═══ PROFILES ═══
-- Profiles needs special handling: users can read all, update their own, admins can update any
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (is_admin());
