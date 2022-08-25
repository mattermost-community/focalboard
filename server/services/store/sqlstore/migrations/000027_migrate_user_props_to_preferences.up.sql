{{if .plugin}}
    {{- /* For plugin mode, we need to write into Mattermost's preferences table, hence, no use of `prefix`. */ -}}

    {{if .postgres}}
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'welcomePageViewed', replace((props->'focalboard_welcomePageViewed')::varchar, '"', '') FROM users WHERE props->'focalboard_welcomePageViewed' IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'hiddenBoardIDs', replace(replace(replace((props->'hiddenBoardIDs')::varchar, '"[', '['), ']"', ']'), '\"', '"') FROM users WHERE props->'hiddenBoardIDs' IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'tourCategory', replace((props->'focalboard_tourCategory')::varchar, '"', '') FROM users WHERE props->'focalboard_tourCategory' IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStep', replace((props->'focalboard_onboardingTourStep')::varchar, '"', '') FROM users WHERE props->'focalboard_onboardingTourStep' IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStarted', replace((props->'focalboard_onboardingTourStarted')::varchar, '"', '') FROM users WHERE props->'focalboard_onboardingTourStarted' IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'version72MessageCanceled', replace((props->'focalboard_version72MessageCanceled')::varchar, '"', '') FROM users WHERE props->'focalboard_version72MessageCanceled' IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'lastWelcomeVersion', replace((props->'focalboard_lastWelcomeVersion')::varchar, '"', '') FROM users WHERE props->'focalboard_lastWelcomeVersion' IS NOT NULL;

        UPDATE users SET props = (props - 'focalboard_welcomePageViewed' - 'hiddenBoardIDs' - 'focalboard_tourCategory' - 'focalboard_onboardingTourStep' - 'focalboard_onboardingTourStarted' - 'focalboard_version72MessageCanceled' - 'focalboard_lastWelcomeVersion');

    {{else}}
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'welcomePageViewed', replace(JSON_EXTRACT(props, '$.focalboard_welcomePageViewed'), '"', '') FROM users WHERE JSON_EXTRACT(props, '$.focalboard_welcomePageViewed') IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'hiddenBoardIDs', replace(replace(replace(JSON_EXTRACT(props, '$.hiddenBoardIDs'), '"[', '['), ']"', ']'), '\\"', '"') FROM users WHERE JSON_EXTRACT(props, '$.hiddenBoardIDs') IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'tourCategory', replace(JSON_EXTRACT(props, '$.focalboard_tourCategory'), '"', '') FROM users WHERE JSON_EXTRACT(props, '$.focalboard_tourCategory') IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStep', replace(JSON_EXTRACT(props, '$.focalboard_onboardingTourStep'), '"', '') FROM users WHERE JSON_EXTRACT(props, '$.focalboard_onboardingTourStep') IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStarted', replace(JSON_EXTRACT(props, '$.focalboard_onboardingTourStarted'), '"', '') FROM users WHERE JSON_EXTRACT(props, '$.focalboard_onboardingTourStarted') IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'version72MessageCanceled', replace(JSON_EXTRACT(props, '$.focalboard_version72MessageCanceled'), '"', '') FROM users WHERE JSON_EXTRACT(props, '$.focalboard_version72MessageCanceled') IS NOT NULL;
        INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'lastWelcomeVersion', replace(JSON_EXTRACT(props, 'focalboard_lastWelcomeVersion'), '"', '') FROM users WHERE JSON_EXTRACT(props, '$.focalboard_lastWelcomeVersion') IS NOT NULL;

        UPDATE users SET props =  JSON_REMOVE(props, '$.focalboard_welcomePageViewed', '$.hiddenBoardIDs', '$.focalboard_tourCategory', '$.focalboard_onboardingTourStep', '$.focalboard_onboardingTourStarted', '$.focalboard_version72MessageCanceled', '$.focalboard_lastWelcomeVersion');
    {{end}}
{{else}}
    {{- /* For personal server, we need to write to Focalboard's preferences table, hence the use of `prefix`. */ -}}

    {{if .postgres}}
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'welcomePageViewed', replace((props->'focalboard_welcomePageViewed')::varchar, '"', '') from {{.prefix}}users WHERE props->'focalboard_welcomePageViewed' IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'hiddenBoardIDs', replace(replace(replace((props->'hiddenBoardIDs')::varchar, '"[', '['), ']"', ']'), '\"', '"') from {{.prefix}}users WHERE props->'hiddenBoardIDs' IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'tourCategory', replace((props->'focalboard_tourCategory')::varchar, '"', '') from {{.prefix}}users WHERE props->'focalboard_tourCategory' IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStep', replace((props->'focalboard_onboardingTourStep')::varchar, '"', '') from {{.prefix}}users WHERE props->'focalboard_onboardingTourStep' IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStarted', replace((props->'focalboard_onboardingTourStarted')::varchar, '"', '') from {{.prefix}}users WHERE props->'focalboard_onboardingTourStarted' IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'version72MessageCanceled', replace((props->'focalboard_version72MessageCanceled')::varchar, '"', '') from {{.prefix}}users WHERE props->'focalboard_version72MessageCanceled' IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'lastWelcomeVersion', replace((props->'focalboard_lastWelcomeVersion')::varchar, '"', '') from {{.prefix}}users WHERE props->'focalboard_lastWelcomeVersion' IS NOT NULL;

        UPDATE {{.prefix}}users SET props = (props::jsonb - 'focalboard_welcomePageViewed' - 'hiddenBoardIDs' - 'focalboard_tourCategory' - 'focalboard_onboardingTourStep' - 'focalboard_onboardingTourStarted' - 'focalboard_version72MessageCanceled' - 'focalboard_lastWelcomeVersion')::json;

    {{else}}
            {{- /* Surprisingly SQLite and MySQL have same JSON functions and syntax! */ -}}

        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'welcomePageViewed', replace(JSON_EXTRACT(props, '$.focalboard_welcomePageViewed'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(props, '$.focalboard_welcomePageViewed') IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'hiddenBoardIDs', replace(replace(replace(JSON_EXTRACT(props, '$.hiddenBoardIDs'), '"[', '['), ']"', ']'), '\\"', '"') from {{.prefix}}users WHERE JSON_EXTRACT(props, '$.hiddenBoardIDs') IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'tourCategory', replace(JSON_EXTRACT(props, '$.focalboard_tourCategory'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(props, '$.focalboard_tourCategory') IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStep', replace(JSON_EXTRACT(props, '$.focalboard_onboardingTourStep'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(props, '$.focalboard_onboardingTourStep') IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStarted', replace(JSON_EXTRACT(props, '$.focalboard_onboardingTourStarted'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(props, '$.focalboard_onboardingTourStarted') IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'version72MessageCanceled', replace(JSON_EXTRACT(props, '$.focalboard_version72MessageCanceled'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(props, '$.focalboard_version72MessageCanceled') IS NOT NULL;
        INSERT INTO {{.prefix}}preferences (userid, category, name, value) SELECT id, 'focalboard', 'lastWelcomeVersion', replace(JSON_EXTRACT(props, 'focalboard_lastWelcomeVersion'), '"', '') from {{.prefix}}users WHERE JSON_EXTRACT(props, '$.focalboard_lastWelcomeVersion') IS NOT NULL;

        UPDATE {{.prefix}}users SET props =  JSON_REMOVE(props, '$.focalboard_welcomePageViewed', '$.hiddenBoardIDs', '$.focalboard_tourCategory', '$.focalboard_onboardingTourStep', '$.focalboard_onboardingTourStarted', '$.focalboard_version72MessageCanceled', '$.focalboard_lastWelcomeVersion');
    {{end}}
{{end}}
