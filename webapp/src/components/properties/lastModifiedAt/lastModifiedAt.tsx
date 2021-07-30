// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {useIntl} from 'react-intl'

import {Card} from '../../../blocks/card'
import {Block} from '../../../blocks/block'
import {ContentBlock} from '../../../blocks/contentBlock'
import {CommentBlock} from '../../../blocks/commentBlock'
import {Utils} from '../../../utils'

type Props = {
    card: Card,
    contents: Array<ContentBlock|ContentBlock[]>
    comments: CommentBlock[]
}

const LastModifiedAt = (props: Props): JSX.Element => {
    const intl = useIntl()

    let latestBlock: Block = props.card
    if (props.card) {
        const allBlocks = [props.card, ...props.contents.flat(), ...props.comments]
        const sortedBlocks = allBlocks.sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    return (
        <div className='LastModifiedAt octo-propertyvalue'>
            {Utils.displayDateTime(new Date(latestBlock.updateAt), intl)}
        </div>
    )
}

export default LastModifiedAt
