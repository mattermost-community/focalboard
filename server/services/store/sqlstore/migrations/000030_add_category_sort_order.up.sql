{{- /* addColumnIfNeeded schemaName tableName columnName datatype constraint */ -}}
{{ addColumnIfNeeded .schemaName "categories" "sort_order" "BIGINT" "DEFAULT 0"}}
