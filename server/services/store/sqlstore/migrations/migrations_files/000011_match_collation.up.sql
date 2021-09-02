{{if .mysql}}
SET @targetCollation = (SELECT table_collation from information_schema.tables WHERE table_name = 'Channels') AND table_schema = (SELECT DATABASE());

-- blocks
SET @updateCollationQuery = CONCAT('ALTER TABLE focalboard_blocks COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- blocks history
SET @updateCollationQuery = CONCAT('ALTER TABLE focalboard_blocks_history COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- sessions
SET @updateCollationQuery = CONCAT('ALTER TABLE focalboard_sessions COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- sharing
SET @updateCollationQuery = CONCAT('ALTER TABLE focalboard_sharing COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- system settings
SET @updateCollationQuery = CONCAT('ALTER TABLE focalboard_system_settings COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- users
SET @updateCollationQuery = CONCAT('ALTER TABLE focalboard_users COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- workspaces
SET @updateCollationQuery = CONCAT('ALTER TABLE focalboard_workspaces COLLATE ', @targetCollation);
PREPARE stmt FROM @updateCollationQuery;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
{{end}}
