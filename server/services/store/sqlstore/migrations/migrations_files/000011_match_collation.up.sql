{{if .mysql}}
-- collation of mattermost's Channels table
SET @mattermostCollation = (SELECT table_collation from information_schema.tables WHERE table_name = 'Channels' AND table_schema = (SELECT DATABASE()));

-- collation of Focalboard's blocks table
SET @focalboardCollation = (SELECT table_collation from information_schema.tables WHERE table_name = '{{.prefix}}blocks' AND table_schema = (SELECT DATABASE()));

-- Uses mattermost's collation if available.
--
-- This is needed to support running Focalboard in personal server mode,
-- where no Channels table will exists.
-- Wi still update the table collations in personal server mode
-- to avoid the complexities of if-else conditions in MySQL queries,
-- which are not 100% consistent across versions and are a trickier to debug.
SET @targetCollation = COALESCE(@mattermostCollation, @focalboardCollation);

-- blocks
SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}blocks COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- blocks history
SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}blocks_history COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- sessions
SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}sessions COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- sharing
SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}sharing COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- system settings
SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}system_settings COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- users
SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}users COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- workspaces
SET @updateCollationQuery = CONCAT('ALTER TABLE {{.prefix}}workspaces COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
{{end}}
