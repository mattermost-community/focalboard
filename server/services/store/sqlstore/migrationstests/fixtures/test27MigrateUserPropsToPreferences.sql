INSERT INTO karmaboard_users
(id, username, props)
VALUES
('user-id', 'johndoe', '{"karmaboard_welcomePageViewed": true, "hiddenBoardIDs": ["board1", "board2"], "karmaboard_tourCategory": "onboarding", "karmaboard_onboardingTourStep": 1, "karmaboard_onboardingTourStarted": false, "karmaboard_version72MessageCanceled": true, "karmaboard_lastWelcomeVersion": 7}');

INSERT INTO karmaboard_preferences
(UserId, Category, Name, Value)
VALUES
('user-id', 'karmaboard', 'onboardingTourStarted', true);
