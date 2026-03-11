-- Fix existing agreement documents: set name to include resident name, ensure URL matches profile
UPDATE documents d
SET
  name = 'Residency Agreement — ' || COALESCE(p.name, 'Unknown'),
  url = COALESCE(p.agreement_url, d.url)
FROM profiles p
WHERE d.uploaded_by = p.id
  AND d.category = 'Agreements';
