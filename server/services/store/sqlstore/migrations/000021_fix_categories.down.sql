{{if .mysql}}
ALTER TABLE {{.prefix}}categories MODIFY COLUMN channel_id VARCHAR(36) NOT NULL;
ALTER TABLE {{.prefix}}categories MODIFY COLUMN id INT NOT NULL UNIQUE AUTO_INCREMENT;
ALTER TABLE {{.prefix}}category_blocks MODIFY COLUMN id INT NOT NULL UNIQUE AUTO_INCREMENT;
{{end}}

{{if .postgres}}
ALTER TABLE {{.prefix}}category_blocks MODIFY COLUMN id SERIAL NOT NULL;
ALTER TABLE {{.prefix}}categories MODIFY COLUMN channel_id VARCHAR(36) NOT NULL;
{{end}}

{{if .sqlite}}
ALTER TABLE {{.prefix}}categories DROP COLUMN channel_id VARCHAR(36);
{{end}}
