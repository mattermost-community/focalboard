package sqlstore

import "fmt"

func normalizeTablename(schemaName, tableName string) string {
	if schemaName != "" {
		tableName = schemaName + "." + tableName
	}
	return tableName
}

// MySQL

func mysqlAddColumnIfNeeded(schemaName, tableName, columnName, datatype, constraint string) string {
	sql := `
		IF NOT EXISTS( SELECT NULL FROM INFORMATION_SCHEMA.COLUMNS
		WHERE table_name = '%s' AND table_schema = '%s' AND column_name = '%s')  THEN
			ALTER TABLE `TableName` ADD `ColumnName` int(1) NOT NULL default '0';
		END IF;
	`
	return fmt.Sprintf(sql, tableName, schemaName, columnName)
}

// Postgres

func postgresAddColumnIfNeeded(schemaName, tableName, columnName, datatype, constraint string) string {
	tableName = normalizeTablename(schemaName, tableName)
	return fmt.Sprintf("ALTER TABLE %s ADD COLUMN IF NOT EXISTS %s %s %s", tableName, columnName, datatype, constraint)
}

// Sqlite

func sqliteAddColumnIfNeeded(schemaName, tableName, columnName, datatype, constraint string) string {
	return "not implemented yet"
}
