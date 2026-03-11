-- Resident skill assignments and progress
CREATE TABLE IF NOT EXISTS resident_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id text NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  technique int DEFAULT 0,
  timing int DEFAULT 0,
  done boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Add focus_skills to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS focus_skills jsonb DEFAULT '[]'::jsonb;

-- Enable RLS
ALTER TABLE resident_skills ENABLE ROW LEVEL SECURITY;

-- Residents can read their own skills
CREATE POLICY "resident_skills_select_own" ON resident_skills
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Admins can do everything
CREATE POLICY "resident_skills_insert_admin" ON resident_skills
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "resident_skills_update_admin" ON resident_skills
  FOR UPDATE USING (is_admin());
CREATE POLICY "resident_skills_delete_admin" ON resident_skills
  FOR DELETE USING (is_admin());
