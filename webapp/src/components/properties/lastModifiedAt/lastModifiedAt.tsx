// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {Card} from '../../../blocks/card'
import {IBlock} from '../../../blocks/block'
import {ContentBlock} from '../../../blocks/contentBlock'
import {CommentBlock} from '../../../blocks/commentBlock'

const moment = require('moment')

type Props = {
    card: Card,
    contents: Array<ContentBlock|ContentBlock[]>
    comments: CommentBlock[]
}

const LastModifiedAt = (props: Props): JSX.Element => {
    let latestBlock: IBlock = props.card
    if (props.card) {
        const allBlocks = [props.card, ...props.contents.flat(), ...props.comments]
        const sortedBlocks = allBlocks.sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    return (
        <div className='LastModifiedAt octo-propertyvalue'>
            {moment(latestBlock.updateAt).format('llll')}
        </div>
    )
}

export default LastModifiedAt
