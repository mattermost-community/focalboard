create table {{.prefix}}preferences
(
    user_id   varchar(26) not null,
    category varchar(32) not null,
    name     varchar(32) not null,
    value    text        null,
    primary key (user_id, category, name)
    );

create index idx_{{.prefix}}preferences_category
    on {{.prefix}}preferences (category);

create index idx_{{.prefix}}preferences_name
    on {{.prefix}}preferences (name);
