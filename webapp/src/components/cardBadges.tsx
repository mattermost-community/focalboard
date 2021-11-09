// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useMemo} from 'react'

import {Card} from '../blocks/card'
import {useAppSelector} from '../store/hooks'
import {getCardContents} from '../store/contents'
import {getCardComments} from '../store/comments'
import {ContentBlock} from '../blocks/contentBlock'
import {CommentBlock} from '../blocks/commentBlock'
import TextIcon from '../widgets/icons/text'
import MessageIcon from '../widgets/icons/message'
import CheckIcon from '../widgets/icons/check'

import './cardBadges.scss'

type Props = {
    card: Card
    className?: string
}

type Badges = {
    description: boolean
    comments: number
    checkboxes: {
        total: number
        checked: number
    }
}

const hasBadges = (badges: Badges): boolean => {
    return badges.description || badges.comments > 0 || badges.checkboxes.total > 0
}

type ContentsType = Array<ContentBlock | ContentBlock[]>

const calculateBadges = (contents: ContentsType, comments: CommentBlock[]): Badges => {
    let text = 0
    let total = 0
    let checked = 0

    const updateCounters = (block: ContentBlock) => {
        if (block.type === 'text') {
            text++
        } else if (block.type === 'checkbox') {
            total++
            if (block.fields.value) {
                checked++
            }
        }
    }

    for (const content of contents) {
        if (Array.isArray(content)) {
            content.forEach(updateCounters)
        } else {
            updateCounters(content)
        }
    }
    return {
        description: text > 0,
        comments: comments.length,
        checkboxes: {
            total,
            checked,
        },
    }
}

const CardBadges = (props: Props) => {
    const {card, className} = props
    const contents = useAppSelector(getCardContents(card.id))
    const comments = useAppSelector(getCardComments(card.id))
    const badges = useMemo(() => calculateBadges(contents, comments), [contents, comments])
    if (!hasBadges(badges)) {
        return null
    }
    const {checkboxes} = badges
    return (
        <div className={`cardBadges ${className || ''}`}>
            {badges.description &&
                <span title='This card has a description'>
                    <TextIcon/>
                </span>}
            {badges.comments > 0 &&
                <span title='Comments'>
                    <MessageIcon/>
                    {badges.comments}
                </span>}
            {checkboxes.total > 0 &&
                <span title='Checkboxes'>
                    <CheckIcon/>
                    {`${checkboxes.checked}/${checkboxes.total}`}
                </span>}
        </div>
    )
}

export default React.memo(CardBadges)
