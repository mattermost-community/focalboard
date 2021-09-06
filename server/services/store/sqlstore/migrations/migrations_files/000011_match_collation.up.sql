{{if and .mysql .plugin}}
    -- collation of mattermost's Channels table
    SET @mattermostCollation = (SELECT table_collation from information_schema.tables WHERE table_name = 'Channels' AND table_schema = (SELECT DATABASE()));

    -- blocks
    SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}blocks COLLATE ', @mattermostCollation);
    PREPARE stmt FROM @updateCollationQuery;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- blocks history
    SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}blocks_history COLLATE ', @mattermostCollation);
    PREPARE stmt FROM @updateCollationQuery;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- sessions
    SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}sessions COLLATE ', @mattermostCollation);
    PREPARE stmt FROM @updateCollationQuery;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- sharing
    SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}sharing COLLATE ', @mattermostCollation);
    PREPARE stmt FROM @updateCollationQuery;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- system settings
    SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}system_settings COLLATE ', @mattermostCollation);
    PREPARE stmt FROM @updateCollationQuery;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- users
    SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}users COLLATE ', @mattermostCollation);
    PREPARE stmt FROM @updateCollationQuery;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- workspaces
    SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}workspaces COLLATE ', @mattermostCollation);
    PREPARE stmt FROM @updateCollationQuery;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
{{else}}
    -- We need a query here otherwise the migration will result
    -- in an empty query when the if condition is false.
    -- Empty query causes a "Query was empty" error.
    SELECT 1;
{{end}}
