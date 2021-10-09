// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Block} from '../../blocks/block'
import {Card} from '../../blocks/card'
import {ContentHandler} from '../content/contentRegistry'

export type CardDetailContextType = {
    card: Card
    lastAddedBlockId: string
    addBlock: (handler: ContentHandler, index: number) => void
    deleteBlock: (block: Block, index: number) => void
}

const CardDetailContext = React.createContext({} as CardDetailContextType)

export default CardDetailContext
