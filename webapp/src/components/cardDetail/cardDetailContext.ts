// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Card} from '../../blocks/card'
import {ContentHandler} from '../content/contentRegistry'

export type CardDetailContextType = {
    card: Card
    newBlockId: string
    resetNewBlockId: () => void
    addNewBlock: (handler: ContentHandler, index: number) => void
}

const CardDetailContext = React.createContext({} as CardDetailContextType)

export default CardDetailContext
