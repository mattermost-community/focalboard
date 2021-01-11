// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock, MutableBlock} from './block'

type IContentBlock = IBlock

class MutableContentBlock extends MutableBlock implements IContentBlock {
}

export {IContentBlock, MutableContentBlock}
