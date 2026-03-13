-- Add "Model" stage between Mannequin(2) and Competent(3→4)
-- Bump existing technique=3 (was Competent) to 4 (now Competent)
-- technique=2 (Mannequin) stays at 2
UPDATE resident_skills SET technique = 4 WHERE technique = 3;
