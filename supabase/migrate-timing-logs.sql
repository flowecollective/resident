-- Timing practice logs
CREATE TABLE IF NOT EXISTS timing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  minutes int NOT NULL,
  type text NOT NULL DEFAULT 'mannequin',
  date text NOT NULL,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Comments on timing logs
CREATE TABLE IF NOT EXISTS log_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL REFERENCES timing_logs(id) ON DELETE CASCADE,
  from_role text NOT NULL DEFAULT 'resident',
  author_name text NOT NULL DEFAULT '',
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE timing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_comments ENABLE ROW LEVEL SECURITY;

-- Residents can read own logs, admins can read all
CREATE POLICY "timing_logs_select" ON timing_logs
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Residents can insert own logs
CREATE POLICY "timing_logs_insert_own" ON timing_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Residents can delete own logs
CREATE POLICY "timing_logs_delete_own" ON timing_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can insert (for notes) and update logs
CREATE POLICY "timing_logs_insert_admin" ON timing_logs
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "timing_logs_update_admin" ON timing_logs
  FOR UPDATE USING (is_admin());

-- Comments: readable by log owner + admins
CREATE POLICY "log_comments_select" ON log_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM timing_logs WHERE timing_logs.id = log_comments.log_id AND (timing_logs.user_id = auth.uid() OR is_admin()))
  );

-- Both residents and admins can add comments
CREATE POLICY "log_comments_insert" ON log_comments
  FOR INSERT WITH CHECK (true);
