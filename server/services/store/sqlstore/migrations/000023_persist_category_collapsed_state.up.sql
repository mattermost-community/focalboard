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
         "SELECT 1",
         CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " BOOLEAN DEFAULT false;")
    ));
    PREPARE alterIfNotExists FROM @preparedStatement;
    EXECUTE alterIfNotExists;
    DEALLOCATE PREPARE alterIfNotExists;
{{end}}

{{if .postgres}}
    ALTER TABLE {{.prefix}}categories ADD COLUMN IF NOT EXISTS collapsed BOOLEAN DEFAULT false;
{{end}}

{{if .sqlite}}
    ALTER TABLE {{.prefix}}categories ADD collapsed boolean default false;
{{end}}
