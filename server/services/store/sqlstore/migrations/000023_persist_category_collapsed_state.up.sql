{{- /* addColumnIfNeeded(schemaName, tableName, columnName, datatype, constraint string) */ -}}
{{ addColumnIfNeeded .schemaName "categories" "collapsed" "boolean" "default false"}}
