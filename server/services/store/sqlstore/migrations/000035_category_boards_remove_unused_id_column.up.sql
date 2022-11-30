{{if .postgres}}
ALTER TABLE {{.prefix}}category_boards DROP COLUMN IF EXISTS id;
{{end}}

{{if .mysql}}
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE table_name = '{{.prefix}}category_boards'
        AND table_schema = DATABASE()
        AND column_name = 'id'
    ) > 0,
    'ALTER TABLE {{.prefix}}category_boards DROP COLUMN id;',
    'SELECT 1'
));

PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;
{{end}}