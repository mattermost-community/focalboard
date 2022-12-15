// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {Block} from '../../blocks/block'
import {useAppSelector} from '../../store/hooks'
import {getLastCardContent} from '../../store/contents'
import {getLastCardComment} from '../../store/comments'
import Person from '../person/person'

import {PropertyProps} from '../types'

const LastModifiedBy = (props: PropertyProps): JSX.Element => {
    const lastContent = useAppSelector(getLastCardContent(props.item.id || '')) as Block
    const lastComment = useAppSelector(getLastCardComment(props.item.id)) as Block

    let latestBlock: Block = props.item
    if (props.board) {
        const allBlocks: Block[] = [props.item, lastContent, lastComment]
        const sortedBlocks = allBlocks.sort((a, b) => b.updateAt - a.updateAt)

        latestBlock = sortedBlocks.length > 0 ? sortedBlocks[0] : latestBlock
    }

    return (
        <Person
            {...props}
            propertyValue={latestBlock.modifiedBy}
            readOnly={true} // created by is an immutable property, so will always be readonly
        />
    )
}

export default LastModifiedBy
