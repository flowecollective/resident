-- Add "Competent" stage between On Pace(2) and Floor Ready(3→4)
-- Bump existing timing=3 (was Floor Ready) to 4 (now Floor Ready)
UPDATE resident_skills SET timing = 4 WHERE timing = 3;
