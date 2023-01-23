// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useCallback, useContext, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {BlockIcons} from '../../blockIcons'
import {Page} from '../../blocks/page'
import {Board} from '../../blocks/board'
import mutator from '../../mutator'
import isPagesContext from '../../isPages'
import Button from '../../widgets/buttons/button'
import Editable from '../../widgets/editable'
import CompassIcon from '../../widgets/icons/compassIcon'
import {Permission} from '../../constants'
import {useHasCurrentBoardPermissions} from '../../hooks/permissions'

import PageIconSelector from './pageIconSelector'
import './pageTitle.scss'

type Props = {
    page: Page
    board: Board
    readonly: boolean
}

const PageTitle = (props: Props) => {
    const {page, board} = props
    const intl = useIntl()
    const isPages = useContext(isPagesContext)
    const canEditBoardProperties = useHasCurrentBoardPermissions([Permission.ManageBoardProperties])
    const readonly = props.readonly || !canEditBoardProperties

    let initialTitle = page.title
    if (page.parentId === '') {
        initialTitle = board.title
    }
    const [title, setTitle] = useState(initialTitle)

    const onEditTitleSave = useCallback(() => {
        if (page.parentId === '') {
            mutator.changeBoardTitle(board.id, board.title, title)
        }
        mutator.changeBlockTitle(board.id, page.id, page.title, title)
    }, [board.id, board.title, page.id, page.title, title])

    const onEditTitleCancel = useCallback(() => setTitle(initialTitle), [initialTitle])

    const onAddRandomIcon = useCallback(() => {
        const newIcon = BlockIcons.shared.randomIcon()
        if (page.parentId === '') {
            mutator.changeBoardIcon(props.board.id, props.board.icon, newIcon)
        }
        mutator.changeBlockIcon(page.boardId, page.id, page.fields?.icon, newIcon)
    }, [page.boardId, page.id, page.fields?.icon, props.board.icon])

    useEffect(() => {
        setTitle(page.title)
    }, [page.id])

    let hasIcon = Boolean(page.fields.icon)
    if (page.parentId === '') {
        hasIcon = Boolean(board.icon)
    }

    return (
        <div className='PageTitle'>
            <div className='add-buttons add-visible'>
                {!readonly && !hasIcon &&
                    <Button
                        emphasis='default'
                        size='xsmall'
                        onClick={onAddRandomIcon}
                        icon={
                            <CompassIcon
                                icon='emoticon-outline'
                            />}
                    >
                        <FormattedMessage
                            id='TableComponent.add-icon'
                            defaultMessage='Add icon'
                        />
                    </Button>
                }
            </div>

            <div className='title'>
                <PageIconSelector
                    page={props.page}
                    board={props.board}
                    readonly={readonly}
                />
                <Editable
                    className='title'
                    value={title}
                    placeholderText={isPages ? intl.formatMessage({id: 'ViewTitle.untitled-page', defaultMessage: 'Untitled page'}) : intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board'})}
                    onChange={(newTitle) => setTitle(newTitle)}
                    saveOnEsc={true}
                    onSave={onEditTitleSave}
                    onCancel={onEditTitleCancel}
                    readonly={readonly}
                    spellCheck={true}
                />
            </div>
        </div>
    )
}

export default React.memo(PageTitle)
