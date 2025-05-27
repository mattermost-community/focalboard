{{if .plugin}}
    {{- /* For plugin mode, we need to write into Mattermost's `Preferences` table, hence, no use of `prefix`. */ -}}

    {{if .postgres}}
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'welcomePageViewed', replace((Props->'karmaboard_welcomePageViewed')::varchar, '"', '') FROM Users WHERE Props->'karmaboard_welcomePageViewed' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'hiddenBoardIDs', replace(replace(replace((Props->'hiddenBoardIDs')::varchar, '"[', '['), ']"', ']'), '\"', '"') FROM Users WHERE Props->'hiddenBoardIDs' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'tourCategory', replace((Props->'karmaboard_tourCategory')::varchar, '"', '') FROM Users WHERE Props->'karmaboard_tourCategory' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStep', replace((Props->'karmaboard_onboardingTourStep')::varchar, '"', '') FROM Users WHERE Props->'karmaboard_onboardingTourStep' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStarted', replace((Props->'karmaboard_onboardingTourStarted')::varchar, '"', '') FROM Users WHERE Props->'karmaboard_onboardingTourStarted' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'version72MessageCanceled', replace((Props->'karmaboard_version72MessageCanceled')::varchar, '"', '') FROM Users WHERE Props->'karmaboard_version72MessageCanceled' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'lastWelcomeVersion', replace((Props->'karmaboard_lastWelcomeVersion')::varchar, '"', '') FROM Users WHERE Props->'karmaboard_lastWelcomeVersion' IS NOT NULL ON CONFLICT DO NOTHING;

        UPDATE Users SET props = (props - 'karmaboard_welcomePageViewed' - 'hiddenBoardIDs' - 'karmaboard_tourCategory' - 'karmaboard_onboardingTourStep' - 'karmaboard_onboardingTourStarted' - 'karmaboard_version72MessageCanceled' - 'karmaboard_lastWelcomeVersion') WHERE jsonb_typeof(props) = 'object';
    {{end}}

    {{if .mysql}}
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'welcomePageViewed', replace(JSON_EXTRACT(Props, '$."karmaboard_welcomePageViewed"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_welcomePageViewed') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'hiddenBoardIDs', replace(replace(replace(JSON_EXTRACT(Props, '$."hiddenBoardIDs"'), '"[', '['), ']"', ']'), '\\"', '"') FROM Users WHERE JSON_EXTRACT(Props, '$.hiddenBoardIDs') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'tourCategory', replace(JSON_EXTRACT(Props, '$."karmaboard_tourCategory"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_tourCategory') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStep', replace(JSON_EXTRACT(Props, '$."karmaboard_onboardingTourStep"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_onboardingTourStep') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStarted', replace(JSON_EXTRACT(Props, '$."karmaboard_onboardingTourStarted"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_onboardingTourStarted') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'version72MessageCanceled', replace(JSON_EXTRACT(Props, '$."karmaboard_version72MessageCanceled"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_version72MessageCanceled') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'lastWelcomeVersion', replace(JSON_EXTRACT(Props, '$."karmaboard_lastWelcomeVersion"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_lastWelcomeVersion') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;

        UPDATE Users SET Props =  JSON_REMOVE(Props, '$."karmaboard_welcomePageViewed"', '$."hiddenBoardIDs"', '$."karmaboard_tourCategory"', '$."karmaboard_onboardingTourStep"', '$."karmaboard_onboardingTourStarted"', '$."karmaboard_version72MessageCanceled"', '$."karmaboard_lastWelcomeVersion"');
    {{end}}

    {{if .sqlite}}
        INSERT OR IGNORE INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'welcomePageViewed', replace(JSON_EXTRACT(Props, '$."karmaboard_welcomePageViewed"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_welcomePageViewed') IS NOT NULL;
        INSERT OR IGNORE INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'hiddenBoardIDs', replace(replace(replace(JSON_EXTRACT(Props, '$."hiddenBoardIDs'), '"[', '['), ']"', ']'), '\\"', '"') FROM Users WHERE JSON_EXTRACT(Props, '$.hiddenBoardIDs') IS NOT NULL;
        INSERT OR IGNORE INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'tourCategory', replace(JSON_EXTRACT(Props, '$."karmaboard_tourCategory"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_tourCategory') IS NOT NULL;
        INSERT OR IGNORE INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStep', replace(JSON_EXTRACT(Props, '$."karmaboard_onboardingTourStep"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_onboardingTourStep') IS NOT NULL;
        INSERT OR IGNORE INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStarted', replace(JSON_EXTRACT(Props, '$."karmaboard_onboardingTourStarted"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_onboardingTourStarted') IS NOT NULL;
        INSERT OR IGNORE INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'version72MessageCanceled', replace(JSON_EXTRACT(Props, '$."karmaboard_version72MessageCanceled"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_version72MessageCanceled') IS NOT NULL;
        INSERT OR IGNORE INTO Preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'lastWelcomeVersion', replace(JSON_EXTRACT(Props, '$."karmaboard_lastWelcomeVersion"'), '"', '') FROM Users WHERE JSON_EXTRACT(Props, '$.karmaboard_lastWelcomeVersion') IS NOT NULL;

        UPDATE Users SET Props =  JSON_REMOVE(Props, '$."karmaboard_welcomePageViewed"', '$."hiddenBoardIDs"', '$."karmaboard_tourCategory"', '$."karmaboard_onboardingTourStep"', '$."karmaboard_onboardingTourStarted"', '$."karmaboard_version72MessageCanceled"', '$."karmaboard_lastWelcomeVersion"');
    {{end}}
{{else}}
    {{- /* For personal server, we need to write to Karmaboard's preferences table, hence the use of `prefix`. */ -}}

    {{if .postgres}}
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'welcomePageViewed', replace((Props->'karmaboard_welcomePageViewed')::varchar, '"', '') from {{.prefix}}users WHERE Props->'karmaboard_welcomePageViewed' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'hiddenBoardIDs', replace(replace(replace((Props->'hiddenBoardIDs')::varchar, '"[', '['), ']"', ']'), '\"', '"') from {{.prefix}}users WHERE Props->'hiddenBoardIDs' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'tourCategory', replace((Props->'karmaboard_tourCategory')::varchar, '"', '') from {{.prefix}}users WHERE Props->'karmaboard_tourCategory' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStep', replace((Props->'karmaboard_onboardingTourStep')::varchar, '"', '') from {{.prefix}}users WHERE Props->'karmaboard_onboardingTourStep' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStarted', replace((Props->'karmaboard_onboardingTourStarted')::varchar, '"', '') from {{.prefix}}users WHERE Props->'karmaboard_onboardingTourStarted' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'version72MessageCanceled', replace((Props->'karmaboard_version72MessageCanceled')::varchar, '"', '') from {{.prefix}}users WHERE Props->'karmaboard_version72MessageCanceled' IS NOT NULL ON CONFLICT DO NOTHING;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'lastWelcomeVersion', replace((Props->'karmaboard_lastWelcomeVersion')::varchar, '"', '') from {{.prefix}}users WHERE Props->'karmaboard_lastWelcomeVersion' IS NOT NULL ON CONFLICT DO NOTHING;

        UPDATE {{.prefix}}users SET props = (props::jsonb - 'karmaboard_welcomePageViewed' - 'hiddenBoardIDs' - 'karmaboard_tourCategory' - 'karmaboard_onboardingTourStep' - 'karmaboard_onboardingTourStarted' - 'karmaboard_version72MessageCanceled' - 'karmaboard_lastWelcomeVersion')::json WHERE jsonb_typeof(props::jsonb) = 'object';
    {{end}}

    {{if .mysql}}
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'welcomePageViewed', replace(JSON_EXTRACT(Props, '$."karmaboard_welcomePageViewed"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_welcomePageViewed') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'hiddenBoardIDs', replace(replace(replace(JSON_EXTRACT(Props, '$."hiddenBoardIDs"'), '"[', '['), ']"', ']'), '\\"', '"') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.hiddenBoardIDs') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'tourCategory', replace(JSON_EXTRACT(Props, '$."karmaboard_tourCategory"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_tourCategory') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStep', replace(JSON_EXTRACT(Props, '$."karmaboard_onboardingTourStep"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_onboardingTourStep') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStarted', replace(JSON_EXTRACT(Props, '$."karmaboard_onboardingTourStarted"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_onboardingTourStarted') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'version72MessageCanceled', replace(JSON_EXTRACT(Props, '$."karmaboard_version72MessageCanceled"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_version72MessageCanceled') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;
        INSERT INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'lastWelcomeVersion', replace(JSON_EXTRACT(Props, '$."karmaboard_lastWelcomeVersion"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_lastWelcomeVersion') IS NOT NULL ON DUPLICATE KEY UPDATE value = value;

        UPDATE {{.prefix}}users SET Props =  JSON_REMOVE(Props, '$."karmaboard_welcomePageViewed"', '$."hiddenBoardIDs"', '$."karmaboard_tourCategory"', '$."karmaboard_onboardingTourStep"', '$."karmaboard_onboardingTourStarted"', '$."karmaboard_version72MessageCanceled"', '$."karmaboard_lastWelcomeVersion"');
    {{end}}

    {{if .sqlite}}
        {{- /* Surprisingly SQLite and MySQL have same JSON functions and syntax! */ -}}

        INSERT OR IGNORE INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'welcomePageViewed', replace(JSON_EXTRACT(Props, '$."karmaboard_welcomePageViewed"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_welcomePageViewed') IS NOT NULL;
        INSERT OR IGNORE INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'hiddenBoardIDs', replace(replace(replace(JSON_EXTRACT(Props, '$."hiddenBoardIDs"'), '"[', '['), ']"', ']'), '\\"', '"') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.hiddenBoardIDs') IS NOT NULL;
        INSERT OR IGNORE INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'tourCategory', replace(JSON_EXTRACT(Props, '$."karmaboard_tourCategory"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_tourCategory') IS NOT NULL;
        INSERT OR IGNORE INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStep', replace(JSON_EXTRACT(Props, '$."karmaboard_onboardingTourStep"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_onboardingTourStep') IS NOT NULL;
        INSERT OR IGNORE INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'onboardingTourStarted', replace(JSON_EXTRACT(Props, '$."karmaboard_onboardingTourStarted"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_onboardingTourStarted') IS NOT NULL;
        INSERT OR IGNORE INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'version72MessageCanceled', replace(JSON_EXTRACT(Props, '$."karmaboard_version72MessageCanceled"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_version72MessageCanceled') IS NOT NULL;
        INSERT OR IGNORE INTO {{.prefix}}preferences (UserId, Category, Name, Value) SELECT Id, 'karmaboard', 'lastWelcomeVersion', replace(JSON_EXTRACT(Props, '$."karmaboard_lastWelcomeVersion"'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(Props, '$.karmaboard_lastWelcomeVersion') IS NOT NULL;

        UPDATE {{.prefix}}users SET Props =  JSON_REMOVE(Props, '$."karmaboard_welcomePageViewed"', '$."hiddenBoardIDs"', '$."karmaboard_tourCategory"', '$."karmaboard_onboardingTourStep"', '$."karmaboard_onboardingTourStarted"', '$."karmaboard_version72MessageCanceled"', '$."karmaboard_lastWelcomeVersion"');
    {{end}}

{{end}}
