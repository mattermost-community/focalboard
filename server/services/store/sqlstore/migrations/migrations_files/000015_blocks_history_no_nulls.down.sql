-- no reverse migration for this version

-- We need a query here otherwise the migration will result
-- in an empty query when the if condition is false.
-- Empty query causes a "Query was empty" error.
SELECT 1;
