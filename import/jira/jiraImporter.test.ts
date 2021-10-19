// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {run} from './jiraImporter'

describe('import from Jira', () => {
    test('import', async () => {
        const inputFile = './test/jira-export.xml'
        const outputFile = './test/jira.focalboard'
        await run(inputFile, outputFile)
    })
})
