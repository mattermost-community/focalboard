// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'

import {BlockIcons} from '../../blockIcons'
import {Page} from '../../blocks/page'
import {Board} from '../../blocks/board'

import mutator from '../../mutator'

import IconSelector from '../iconSelector'

type Props = {
    page: Page
    board: Board
    size?: 's' | 'm' | 'l'
    readonly?: boolean
}

const PageIconSelector = React.memo((props: Props) => {
    const {board, page, size} = props

    const onSelectEmoji = useCallback((emoji: string) => {
        if (page.parentId === '') {
            mutator.changeBoardIcon(board.id, board.icon, emoji)
        }
        mutator.changeBlockIcon(page.boardId, page.id, page.fields?.icon, emoji)
        document.body.click()
    }, [page?.boardId, page?.id, page?.fields?.icon, board.id, board.icon])

    const onAddRandomIcon = useCallback(() => {
        if (page.parentId === '') {
            mutator.changeBoardIcon(board.id, board.icon, BlockIcons.shared.randomIcon())
        }
        mutator.changeBlockIcon(page.boardId, page.id, page.fields?.icon, BlockIcons.shared.randomIcon())
    }, [page?.boardId, page?.id, page?.fields?.icon, board.id, board.icon])

    const onRemoveIcon = useCallback(() => {
        if (page.parentId === '') {
            mutator.changeBoardIcon(board.id, board.icon, '', 'remove page icon')
        }
        mutator.changeBlockIcon(page.boardId, page.id, page.fields?.icon, '', 'remove page icon')
    }, [page?.boardId, page?.id, page?.fields?.icon, board.id, board.icon])

    let icon = board.icon
    if (page.parentId !== '') {
        icon = page.fields?.icon
    }

    if (!icon) {
        return null
    }

    let className = `octo-icon size-${size || 'm'}`
    if (props.readonly) {
        className += ' readonly'
    }
    const iconElement = <div className={className}><span>{icon}</span></div>

    return (
        <IconSelector
            readonly={props.readonly}
            iconElement={iconElement}
            onAddRandomIcon={onAddRandomIcon}
            onSelectEmoji={onSelectEmoji}
            onRemoveIcon={onRemoveIcon}
        />
    )
})

export default PageIconSelector
