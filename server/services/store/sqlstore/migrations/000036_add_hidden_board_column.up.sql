{{if .postgres}}
ALTER TABLE {{.prefix}}category_boards ADD COLUMN IF NOT EXISTS hidden boolean;
{{end}}

{{if .mysql}}
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE table_name = '{{.prefix}}category_boards'
        AND table_schema = DATABASE()
        AND column_name = 'hidden'
    ) > 0,
    'SELECT 1',
    'ALTER TABLE {{.prefix}}category_boards ADD COLUMN hidden boolean;'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
{{end}}