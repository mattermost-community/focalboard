// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock, Block} from './block'

type IContentBlockWithCords = {
    block: IBlock,
    cords: {x: number, y?: number, z?: number}
}

class ContentBlock extends Block {}

export {ContentBlock, IContentBlockWithCords}
