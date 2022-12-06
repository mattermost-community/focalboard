{{if .postgres}}
ALTER TABLE focalboard_category_boards ADD COLUMN IF NOT EXISTS hidden boolean default false;
{{end}}

{{if .mysql}}
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE table_name = 'focalboard_category_boards'
        AND table_schema = DATABASE()
        AND column_name = 'hidden'
    ) > 0,
    'SELECT 1',
    'ALTER TABLE focalboard_category_boards ADD COLUMN hidden boolean DEFAULT false;'
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
{{end}}