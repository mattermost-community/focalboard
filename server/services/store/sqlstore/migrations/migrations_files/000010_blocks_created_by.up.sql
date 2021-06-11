ALTER TABLE {{.prefix}}blocks ADD COLUMN create_by VARCHAR(36);
ALTER TABLE {{.prefix}}blocks_history ADD COLUMN create_by VARCHAR(36);

UPDATE {{.prefix}}blocks SET create_by = (select modified_by from {{.prefix}}blocks_history where {{.prefix}}blocks_history.id = {{.prefix}}blocks.id ORDER BY {{.prefix}}blocks_history.insert_at ASC limit 1);
