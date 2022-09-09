ALTER TABLE {{.prefix}}blocks ADD COLUMN created_by VARCHAR(36);
ALTER TABLE {{.prefix}}blocks_history ADD COLUMN created_by VARCHAR(36);

UPDATE {{.prefix}}blocks SET created_by = COALESCE(NULLIF((select modified_by from {{.prefix}}blocks_history where {{.prefix}}blocks_history.id = {{.prefix}}blocks.id ORDER BY {{.prefix}}blocks_history.insert_at ASC limit 1), ''), 'system');
