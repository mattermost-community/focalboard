// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// This won't exist locally when running in CI
// eslint-disable-next-line no-process-env
if (!process.env.CI) {
    require('mattermost-webapp/tests/setup')
}
