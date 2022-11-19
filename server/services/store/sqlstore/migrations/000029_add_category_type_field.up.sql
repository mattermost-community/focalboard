{{- /* addColumnIfNeeded(schemaName, tableName, columnName, datatype, constraint string) */ -}}
{{ addColumnIfNeeded .schemaName "categories" "type" "varchar(64)" ""}}

UPDATE {{.prefix}}categories SET type = 'custom' WHERE type IS NULL;
