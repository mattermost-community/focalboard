ALTER TABLE {{.prefix}}boards ADD COLUMN virtual_driver TEXT NOT NULL DEFAULT '';
ALTER TABLE {{.prefix}}boards_history ADD COLUMN virtual_driver TEXT NOT NULL DEFAULT '';
ALTER TABLE {{.prefix}}boards ADD COLUMN virtual_link TEXT NOT NULL DEFAULT '';
ALTER TABLE {{.prefix}}boards_history ADD COLUMN virtual_link TEXT NOT NULL DEFAULT '';
