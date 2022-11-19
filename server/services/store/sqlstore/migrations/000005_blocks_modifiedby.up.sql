-- addColumnIfNeeded(schemaName, tableName, columnName, datatype, constraint string)
{{ addColumnIfNeeded .schemaName "blocks" "modified_by" "varchar(36)" ""}}