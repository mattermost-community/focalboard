// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import minimist from 'minimist'
import {run} from './jiraImporter'

async function main() {
    const args: minimist.ParsedArgs = minimist(process.argv.slice(2))

    const inputFile = args['i']
    const outputFile = args['o'] || 'archive.boardarchive'

    return run(inputFile, outputFile)
}

main()
