{{- /* addColumnIfNeeded tableName columnName datatype constraint */ -}}
{{ addColumnIfNeeded "categories" "sort_order" "BIGINT" "DEFAULT 0"}}
