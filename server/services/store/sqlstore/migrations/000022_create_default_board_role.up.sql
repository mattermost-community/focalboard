{{- /* addColumnIfNeeded schemaName tableName columnName datatype constraint */ -}}
{{ addColumnIfNeeded .schemaName "boards" "minimum_role" "varchar(36)" "NOT NULL DEFAULT ''"}}
{{ addColumnIfNeeded .schemaName "boards_history" "minimum_role" "varchar(36)" "NOT NULL DEFAULT ''"}}

UPDATE {{.prefix}}boards SET minimum_role = 'editor' WHERE minimum_role IS NULL OR minimum_role='';
UPDATE {{.prefix}}boards_history SET minimum_role = 'editor' WHERE minimum_role IS NULL OR minimum_role='';
