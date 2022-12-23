


{{if .postgres}}
-- dropping before adding constraint to make migration idempotent
ALTER TABLE {{.prefix}}category_boards DROP CONSTRAINT IF EXISTS unique_user_category_board;
ALTER TABLE {{.prefix}}category_boards ADD CONSTRAINT unique_user_category_board UNIQUE(user_id, board_id);
{{end}}

{{if .mysql}}
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
        WHERE constraint_schema = DATABASE()
        AND constraint_name = 'unique_user_category_board'
        AND constraint_type = 'UNIQUE'
    ) > 0,
    'SELECT 1;',
    'ALTER TABLE {{.prefix}}category_boards ADD CONSTRAINT UNIQUE(user_id, board_id);'
));

PREPARE addUniqueConstraintIfNotExist FROM @preparedStatement;
EXECUTE addUniqueConstraintIfNotExist;
DEALLOCATE PREPARE addUniqueConstraintIfNotExist;
{{end}}