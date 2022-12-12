CREATE TABLE IF NOT EXISTS {{.prefix}}preferences
(
    userid   varchar(36) not null,
    category varchar(32) not null,
    name     varchar(32) not null,
    value    text        null,
    primary key (userid, category, name)
    );

{{- /* createIndexIfNeeded tableName columns */ -}}
{{ createIndexIfNeeded "preferences" "category" }}
{{ createIndexIfNeeded "preferences" "name" }}
