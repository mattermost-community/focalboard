{{if .mysql}}
ALTER TABLE {{.prefix}}blocks MODIFY creatde_by varchar(36);
ALTER TABLE {{.prefix}}blocks MODIFY updated_by varchar(36);
{{end}}

{{if .postgres}}
ALTER TABLE {{.prefix}}blocks ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE {{.prefix}}blocks ALTER COLUMN updated_by DROP NOT NULL;
{{end}}
