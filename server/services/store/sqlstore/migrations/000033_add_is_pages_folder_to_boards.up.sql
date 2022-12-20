{{- /* addColumnIfNeeded tableName columnName datatype constraint */ -}}
{{ addColumnIfNeeded "boards" "is_pages_folder" "boolean" "false"}}
{{ addColumnIfNeeded "boards_history" "is_pages_folder" "boolean" "false"}}
