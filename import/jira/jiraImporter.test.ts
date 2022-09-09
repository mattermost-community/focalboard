// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {run} from './jiraImporter'
import * as fs from 'fs'
import {ArchiveUtils} from '../util/archive'

const inputFile = './test/jira-export.xml'
const outputFile = './test/jira.focalboard'

describe('import from Jira', () => {
    test('import', async () => {
        const blockCount = await run(inputFile, outputFile)
        expect(blockCount === 4)
    })

    test('import was complete', async () => {
        const archiveData = fs.readFileSync(outputFile, 'utf-8')
        const blocks = ArchiveUtils.parseBlockArchive(archiveData)

        console.debug(blocks)


        blocks.forEach(block => {
            console.log(block.title)
        })

        expect(blocks).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    title: 'Board View',
                    type: 'view'
                }),
                expect.objectContaining({
                    title: 'Investigate feature area',
                    type: 'card'
                }),
                expect.objectContaining({
                    title: 'Investigate feature',
                    type: 'card'
                }),
            ])
        )
    })

    afterAll(() => {
        fs.rmSync(outputFile)
    });
})
