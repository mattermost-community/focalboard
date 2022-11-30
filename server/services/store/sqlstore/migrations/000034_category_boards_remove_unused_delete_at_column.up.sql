{{if .postgres}}
ALTER TABLE {{.prefix}}category_boards DROP COLUMN IF EXISTS delete_at;
{{end}}

{{if .mysql}}
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE table_name = '{{.prefix}}category_boards'
        AND table_schema = DATABASE()
        AND column_name = 'delete_at'
    ) > 0,
    'ALTER TABLE {{.prefix}}category_boards DROP COLUMN delete_at;',
    'SELECT 1'
));

PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;
{{end}}