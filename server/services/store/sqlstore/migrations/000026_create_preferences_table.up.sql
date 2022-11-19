CREATE TABLE IF NOT EXISTS {{.prefix}}preferences
(
    userid   varchar(36) not null,
    category varchar(32) not null,
    name     varchar(32) not null,
    value    text        null,
    primary key (userid, category, name)
    );

{{- /* createIndexIfNeeded(schemaName, tableName, columns string) */ -}}
{{ createIndexIfNeeded .schemaName "preferences" "category" }}
{{ createIndexIfNeeded .schemaName "preferences" "name" }}
