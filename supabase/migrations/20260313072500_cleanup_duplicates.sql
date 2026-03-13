-- Clean up duplicate categories from failed CSV imports
DELETE FROM skills WHERE category_id IN (
  SELECT id FROM categories WHERE name = 'Color Services' AND id != (
    SELECT id FROM categories WHERE name = 'Color Services' ORDER BY id LIMIT 1
  )
);
DELETE FROM categories WHERE name = 'Color Services' AND id != (
  SELECT id FROM categories WHERE name = 'Color Services' ORDER BY id LIMIT 1
);
