-- Remove "Competent" (index 4) from technique stages
-- Shift Floor Ready from index 5→4, Competent(4) merges into Floor Ready(4)
UPDATE resident_skills SET technique = 4 WHERE technique = 5;
UPDATE resident_skills SET technique = 4 WHERE technique = 4;
