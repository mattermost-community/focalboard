{{- /* addColumnIfNeeded schemaName tableName columnName datatype constraint */ -}}
{{ addColumnIfNeeded .schemaName "categories" "collapsed" "boolean" "default false"}}
