{{if .mysql}}
    SET @dbname = DATABASE();
    SET @tablename = "{{.prefix}}categories";
    SET @columnname = "collapsed";
    SET @preparedStatement = (SELECT IF(
         (
             SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
             WHERE
                 (table_name = @tablename)
               AND (table_schema = @dbname)
               AND (column_name = @columnname)
         ) > 0,
         CONCAT("ALTER TABLE ", @tablename, " DROP COLUMN ", @columnname, ";"),
         "SELECT 1"
    ));
    PREPARE alterIfNotExists FROM @preparedStatement;
    EXECUTE alterIfNotExists;
    DEALLOCATE PREPARE alterIfNotExists;
{{end}}

{{if .postgres}}
    ALTER TABLE {{.prefix}}categories DROP COLUMN IF EXISTS collapsed;
{{end}}

{{if .sqlite}}
    ALTER TABLE {{.prefix}}categories DROP COLUMN collapsed;
{{end}}
