{{if .postgres}}
    INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'welcomePageViewed', replace((props->'focalboard_welcomePageViewed')::varchar, '"', '') FROM users WHERE props ? 'focalboard_welcomePageViewed';
    INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'hiddenBoardIDs', replace(replace(replace((props->'hiddenBoardIDs')::varchar, '"[', '['), ']"', ']'), '\"', '"') FROM users WHERE props ? 'hiddenBoardIDs';
    INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'tourCategory', replace((props->'focalboard_tourCategory')::varchar, '"', '') FROM users WHERE props ? 'focalboard_tourCategory';
    INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStep', replace((props->'focalboard_onboardingTourStep')::varchar, '"', '') FROM users WHERE props ? 'focalboard_onboardingTourStep';
    INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'onboardingTourStarted', replace((props->'focalboard_onboardingTourStarted')::varchar, '"', '') FROM users WHERE props ? 'focalboard_onboardingTourStarted';
    INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'version72MessageCanceled', replace((props->'focalboard_version72MessageCanceled')::varchar, '"', '') FROM users WHERE props ? 'focalboard_version72MessageCanceled';
    INSERT INTO preferences (userid, category, name, value) SELECT id, 'focalboard', 'lastWelcomeVersion', replace((props->'focalboard_lastWelcomeVersion')::varchar, '"', '') FROM users WHERE props ? 'focalboard_lastWelcomeVersion';

    UPDATE users SET props = (props - 'focalboard_welcomePageViewed' - 'hiddenBoardIDs' - 'focalboard_tourCategory' - 'focalboard_onboardingTourStep' - 'focalboard_onboardingTourStarted' - 'focalboard_version72MessageCanceled' - 'focalboard_lastWelcomeVersion');
{{end}}
