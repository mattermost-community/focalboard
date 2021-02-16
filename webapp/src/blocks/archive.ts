// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from './block'

interface IArchive {
    version: number
    date: number
    blocks: readonly IBlock[]
}

export {IArchive}
