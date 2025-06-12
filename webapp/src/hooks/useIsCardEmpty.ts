// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useMemo} from 'react'

import {useAppSelector} from '../store/hooks'
import {Card} from '../blocks/card'
import {getCardComments} from '../store/comments'
import {getCardAttachments} from '../store/attachments'

export const useIsCardEmpty = (card: Card | undefined) => {
    if (!card) {
        return true
    }

    const comments = useAppSelector(getCardComments(card.id))
    const attachments = useAppSelector(getCardAttachments(card.id))

    return useMemo(() => {
        return card?.title === '' && card?.fields.contentOrder.length === 0 && Object.values(card?.fields?.properties).every((x) => !x.length) && comments.length === 0 && attachments.length === 0
    }, [card?.title, card?.fields.contentOrder, card?.fields?.properties, comments, attachments])
}
