DROP TABLE {{.prefix}}blocks;
ALTER TABLE {{.prefix}}blocks_history RENAME TO {{.prefix}}blocks;
