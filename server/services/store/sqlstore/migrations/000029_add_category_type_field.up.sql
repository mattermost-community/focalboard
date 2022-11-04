ALTER TABLE {{.prefix}}categories ADD COLUMN type varchar(64);
UPDATE {{.prefix}}categories SET type = 'custom' WHERE type IS NULL;
