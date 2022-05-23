ALTER TABLE {{.prefix}}boards ADD COLUMN minimum_role VARCHAR(36) NOT NULL DEFAULT '';
ALTER TABLE {{.prefix}}boards_history ADD COLUMN minimum_role VARCHAR(36) NOT NULL DEFAULT '';
UPDATE {{.prefix}}boards SET minimum_role = 'editor';
UPDATE {{.prefix}}boards_history SET minimum_role = 'editor';
