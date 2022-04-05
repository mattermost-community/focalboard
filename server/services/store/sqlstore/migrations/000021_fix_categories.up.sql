{{if .sqlite}}
ALTER TABLE {{.prefix}}categories ADD COLUMN channel_id VARCHAR(36);
{{end}}

{{if .mysql}}
ALTER TABLE {{.prefix}}categories MODIFY COLUMN id VARCHAR(36) NOT NULL;
ALTER TABLE {{.prefix}}category_blocks MODIFY COLUMN id VARCHAR(36) NOT NULL;
ALTER TABLE {{.prefix}}categories MODIFY COLUMN channel_id VARCHAR(36);
{{end}}

{{if .postgres}}
ALTER TABLE {{.prefix}}categories ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE {{.prefix}}categories ALTER COLUMN id SET NOT NULL;
ALTER TABLE {{.prefix}}category_blocks ALTER COLUMN id TYPE VARCHAR(36);
ALTER TABLE {{.prefix}}category_blocks ALTER COLUMN id SET NOT NULL;
ALTER TABLE {{.prefix}}categories ALTER COLUMN channel_id TYPE VARCHAR(36);
ALTER TABLE {{.prefix}}categories ALTER COLUMN channel_id DROP NOT NULL;
{{end}}
