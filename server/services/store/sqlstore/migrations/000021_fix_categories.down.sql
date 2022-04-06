{{if .sqlite}}
ALTER TABLE {{.prefix}}categories DROP COLUMN channel_id VARCHAR(36);
{{end}}

{{if .mysql}}
ALTER TABLE {{.prefix}}categories MODIFY COLUMN channel_id VARCHAR(36) NOT NULL;
ALTER TABLE {{.prefix}}categories MODIFY COLUMN id INT NOT NULL UNIQUE AUTO_INCREMENT;
ALTER TABLE {{.prefix}}category_blocks MODIFY COLUMN id INT NOT NULL UNIQUE AUTO_INCREMENT;
{{end}}

{{if .postgres}}
ALTER TABLE {{.prefix}}categories ALTER COLUMN id DROP NOT NULL;
ALTER TABLE {{.prefix}}categories ALTER COLUMN id TYPE SERIAL;
ALTER TABLE {{.prefix}}category_blocks ALTER COLUMN id DROP NOT NULL;
ALTER TABLE {{.prefix}}category_blocks ALTER COLUMN id TYPE SERIAL;
ALTER TABLE {{.prefix}}categories ALTER COLUMN channel_id TYPE VARCHAR(32);
ALTER TABLE {{.prefix}}categories ALTER COLUMN channel_id SET NOT NULL;
{{end}}
