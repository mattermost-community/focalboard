// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {Board} from '../blocks/board'
import mutator from '../mutator'
import Button from '../widgets/buttons/button'
import Editable from '../widgets/editable'
import EmojiIcon from '../widgets/icons/emoji'
import HideIcon from '../widgets/icons/hide'
import ShowIcon from '../widgets/icons/show'

import BoardIconSelector from './boardIconSelector'
import {MarkdownEditor} from './markdownEditor'
import './viewTitle.scss'

type Props = {
    board: Board
    readonly: boolean
}

const ViewTitle = (props: Props) => {
    const {board} = props

    const [title, setTitle] = useState(board.title)
    const onEditTitleSave = useCallback(() => mutator.changeBoardTitle(board.id, board.title, title), [board.id, board.title, title])
    const onEditTitleCancel = useCallback(() => setTitle(board.title), [board.title])
    const onDescriptionBlur = useCallback((text) => mutator.changeBoardDescription(board.id, board.id, board.description, text), [board.id, board.description])
    const onAddRandomIcon = useCallback(() => {
        const newIcon = BlockIcons.shared.randomIcon()
        mutator.changeBoardIcon(board.id, board.icon, newIcon)
    }, [board.id, board.icon])
    const onShowDescription = useCallback(() => mutator.showBoardDescription(board.id, Boolean(board.showDescription), true), [board.id, board.showDescription])
    const onHideDescription = useCallback(() => mutator.showBoardDescription(board.id, Boolean(board.showDescription), false), [board.id, board.showDescription])

    const intl = useIntl()

    return (
        <div className='ViewTitle'>
            <div className='add-buttons add-visible'>
                {!props.readonly && !board.icon &&
                    <Button
                        onClick={onAddRandomIcon}
                        icon={<EmojiIcon/>}
                    >
                        <FormattedMessage
                            id='TableComponent.add-icon'
                            defaultMessage='Add icon'
                        />
                    </Button>
                }
                {!props.readonly && board.showDescription &&
                    <Button
                        onClick={onHideDescription}
                        icon={<HideIcon/>}
                    >
                        <FormattedMessage
                            id='ViewTitle.hide-description'
                            defaultMessage='hide description'
                        />
                    </Button>
                }
                {!props.readonly && !board.showDescription &&
                    <Button
                        onClick={onShowDescription}
                        icon={<ShowIcon/>}
                    >
                        <FormattedMessage
                            id='ViewTitle.show-description'
                            defaultMessage='show description'
                        />
                    </Button>
                }
            </div>

            <div className='title'>
                <BoardIconSelector board={board}/>
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

            {board.showDescription &&
                <div className='description'>
                    <MarkdownEditor
                        text={board.description}
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
