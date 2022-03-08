// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {Board} from '../blocks/board'
import mutator from '../mutator'
import Button from '../widgets/buttons/button'
import Editable from '../widgets/editable'
import CompassIcon from '../widgets/icons/compassIcon'

import BlockIconSelector from './blockIconSelector'
import {MarkdownEditor} from './markdownEditor'
import './viewTitle.scss'

type Props = {
    board: Board
    readonly: boolean
}

const ViewTitle = (props: Props) => {
    const {board} = props

    const [title, setTitle] = useState(board.title)
    const onEditTitleSave = useCallback(() => mutator.changeTitle(board.id, board.title, title), [board.id, board.title, title])
    const onEditTitleCancel = useCallback(() => setTitle(board.title), [board.title])
    const onDescriptionBlur = useCallback((text) => mutator.changeDescription(board.id, board.fields.description, text), [board.id, board.fields.description])
    const onAddRandomIcon = useCallback(() => {
        const newIcon = BlockIcons.shared.randomIcon()
        mutator.changeIcon(board.id, board.fields.icon, newIcon)
    }, [board.id, board.fields.icon])
    const onShowDescription = useCallback(() => mutator.showDescription(board.id, Boolean(board.fields.showDescription), true), [board.id, board.fields.showDescription])
    const onHideDescription = useCallback(() => mutator.showDescription(board.id, Boolean(board.fields.showDescription), false), [board.id, board.fields.showDescription])

    const intl = useIntl()

    return (
        <div className='ViewTitle'>
            <div className='add-buttons add-visible'>
                {!props.readonly && !board.fields.icon &&
                    <Button
                        emphasis='default'
                        size='small'
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
                {!props.readonly && board.fields.showDescription &&
                    <Button
                        emphasis='default'
                        size='small'
                        onClick={onHideDescription}
                        icon={
                            <CompassIcon
                                icon='eye-off-outline'
                            />}
                    >
                        <FormattedMessage
                            id='ViewTitle.hide-description'
                            defaultMessage='hide description'
                        />
                    </Button>
                }
                {!props.readonly && !board.fields.showDescription &&
                    <Button
                        emphasis='default'
                        size='small'
                        onClick={onShowDescription}
                        icon={
                            <CompassIcon
                                icon='eye-outline'
                            />}
                    >
                        <FormattedMessage
                            id='ViewTitle.show-description'
                            defaultMessage='show description'
                        />
                    </Button>
                }
            </div>

            <div className='title'>
                <BlockIconSelector block={board}/>
                <Editable
                    className='title'
                    value={title}
                    placeholderText={intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled board'})}
                    onChange={(newTitle) => setTitle(newTitle)}
                    saveOnEsc={true}
                    onSave={onEditTitleSave}
                    onCancel={onEditTitleCancel}
                    readonly={props.readonly}
                    spellCheck={true}
                />
            </div>

            {board.fields.showDescription &&
                <div className='description'>
                    <MarkdownEditor
                        text={board.fields.description}
                        placeholderText='Add a description...'
                        onBlur={onDescriptionBlur}
                        readonly={props.readonly}
                    />
                </div>
            }
        </div>
    )
}

export default React.memo(ViewTitle)
