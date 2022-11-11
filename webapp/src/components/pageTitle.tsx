// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useCallback, useContext, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {Page} from '../blocks/page'
import mutator from '../mutator'
import isPagesContext from '../isPages'
import Button from '../widgets/buttons/button'
import Editable from '../widgets/editable'
import CompassIcon from '../widgets/icons/compassIcon'
import {Permission} from '../constants'
import {useHasCurrentBoardPermissions} from '../hooks/permissions'

import PageIconSelector from './pageIconSelector'
import './pageTitle.scss'

type Props = {
    page: Page
    readonly: boolean
}

const PageTitle = (props: Props) => {
    const {page} = props

    const [title, setTitle] = useState(page.title)
    const onEditTitleSave = useCallback(() => mutator.changeBlockTitle(page.boardId, page.id, page.title, title), [page.boardId, page.id, page.title, title])
    const onEditTitleCancel = useCallback(() => setTitle(page.title), [page.title])
    const onAddRandomIcon = useCallback(() => {
        const newIcon = BlockIcons.shared.randomIcon()
        mutator.changeBlockIcon(page.boardId, page.id, page.fields.icon, newIcon)
    }, [page.boardId, page.id, page.fields.icon])
    const canEditBoardProperties = useHasCurrentBoardPermissions([Permission.ManageBoardProperties])
    const isPages = useContext(isPagesContext)

    useEffect(() => {
        setTitle(page.title)
    }, [page.id])

    const readonly = props.readonly || !canEditBoardProperties

    const intl = useIntl()

    return (
        <div className='PageTitle'>
            <div className='add-buttons add-visible'>
                {!readonly && !page.fields.icon &&
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
                    page={page}
                    readonly={readonly}
                />
                <Editable
                    className='title'
                    value={title}
                    placeholderText={isPages ? intl.formatMessage({id: 'ViewTitle.untitled-folder', defaultMessage: 'Untitled folder'}) : intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board'})}
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
