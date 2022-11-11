// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'

import {BlockIcons} from '../blockIcons'
import {Page} from '../blocks/page'

import mutator from '../mutator'

import IconSelector from './iconSelector'

type Props = {
    page: Page
    size?: 's' | 'm' | 'l'
    readonly?: boolean
}

const PageIconSelector = React.memo((props: Props) => {
    const {page, size} = props

    const onSelectEmoji = useCallback((emoji: string) => {
        mutator.changeBlockIcon(page.boardId, page.id, page.fields.icon, emoji)
        document.body.click()
    }, [page.boardId, page.id, page.fields.icon])
    const onAddRandomIcon = useCallback(() => mutator.changeBlockIcon(page.boardId, page.id, page.fields.icon, BlockIcons.shared.randomIcon()), [page.boardId, page.id, page.fields.icon])
    const onRemoveIcon = useCallback(() => mutator.changeBlockIcon(page.boardId, page.id, page.fields.icon, '', 'remove page icon'), [page.boardId, page.id, page.fields.icon])

    console.log(page.fields)

    if (!page.fields.icon) {
        return null
    }

    let className = `octo-icon size-${size || 'm'}`
    if (props.readonly) {
        className += ' readonly'
    }
    const iconElement = <div className={className}><span>{page.fields.icon}</span></div>

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
