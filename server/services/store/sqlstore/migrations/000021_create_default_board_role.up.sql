ALTER TABLE {{.prefix}}boards ADD COLUMN default_role VARCHAR(36) NOT NULL DEFAULT '';
ALTER TABLE {{.prefix}}boards_history ADD COLUMN default_role VARCHAR(36) NOT NULL DEFAULT '';
UPDATE {{.prefix}}boards SET default_role = 'editor';
UPDATE {{.prefix}}boards_history SET default_role = 'editor';
