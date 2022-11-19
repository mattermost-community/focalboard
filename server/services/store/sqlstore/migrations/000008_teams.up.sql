{{- /* addColumnIfNeeded(schemaName, tableName, columnName, datatype, constraint string) */ -}}
{{ addColumnIfNeeded .schemaName "blocks" "workspace_id" "varchar(36)" ""}}

{{ addColumnIfNeeded .schemaName "sharing" "workspace_id" "varchar(36)" ""}}

{{ addColumnIfNeeded .schemaName "sessions" "auth_service" "varchar(20)" ""}}

UPDATE {{.prefix}}blocks SET workspace_id = '0' WHERE workspace_id = '' OR workspace_id IS NULL;
