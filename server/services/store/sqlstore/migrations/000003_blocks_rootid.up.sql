{{- /* addColumnIfNeeded(schemaName, tableName, columnName, datatype, constraint string) */ -}}
{{ addColumnIfNeeded .schemaName "blocks" "root_id" "varchar(36)" ""}}