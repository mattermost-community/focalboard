{{- /* addColumnIfNeeded schemaName tableName columnName datatype constraint */ -}}
{{ addColumnIfNeeded .schemaName "category_boards" "sort_order" "BIGINT" "DEFAULT 0"}}

