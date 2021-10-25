{{if .mysql}}
ALTER TABLE {{.prefix}}blocks MODIFY created_by varchar(36);
ALTER TABLE {{.prefix}}blocks MODIFY modified_by varchar(36);
{{end}}

{{if .postgres}}
ALTER TABLE {{.prefix}}blocks ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE {{.prefix}}blocks ALTER COLUMN modified_by DROP NOT NULL;
{{end}}
