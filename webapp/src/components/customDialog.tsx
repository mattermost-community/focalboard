// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useRef, useState, useCallback} from 'react'
import {useIntl} from 'react-intl'
import {useHotkeys} from 'react-hotkeys-hook'

import IconButton from '../widgets/buttons/iconButton'
import CloseIcon from '../widgets/icons/close'
import OptionsIcon from '../widgets/icons/options'
import MenuWrapper from '../widgets/menuWrapper'
import './customDialog.scss'
import EditableArea from '../widgets/editableArea'
import CardInList from '../components/cardDetail/cardInList'
import {Focusable} from '../widgets/editable'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import {Board, IPropertyOption} from '../blocks/board'
import {Permission} from '../constants'
import {useHasCurrentBoardPermissions} from '../hooks/permissions'

type Props = {
    children: React.ReactNode
    size?: string
    toolsMenu?: React.ReactNode
    toolbar?: React.ReactNode
    hideCloseButton?: boolean
    className?: string
    title?: JSX.Element
    subtitle?: JSX.Element
    card: Card | undefined
    board: Board
    readonly: boolean
    onClose: () => void
    column: IPropertyOption | undefined
}

const CustomDialog = (props: Props) => {
    const {toolsMenu, toolbar, title, subtitle, size, card} = props
    if (card) {
        const { limited } = card;
    }
    const intl = useIntl()
    const [cardTitle, setTitle] = useState(card?.title)
    const [serverTitle, setServerTitle] = useState(card?.title)
    const titleRef = useRef<Focusable>(null)
    
    const saveTitle = useCallback(() => {
        if (card && cardTitle !== card?.title) {
            mutator.changeBlockTitle(props.board.id, card.id, card.title, cardTitle!)
        }
    }, [card?.title, cardTitle])

    const saveTitleRef = useRef<() => void>(saveTitle)
    saveTitleRef.current = saveTitle

    const closeDialogText = intl.formatMessage({
        id: 'Dialog.closeDialog',
        defaultMessage: 'Close dialog',
    })
    const canEditBoardCards = useHasCurrentBoardPermissions([Permission.ManageBoardCards])

    useHotkeys('esc', () => props.onClose())

    const isBackdropClickedRef = useRef(false)

    return (
        <div className={`Dialog dialog-back ${props.className} size--${size || 'medium'}`}>
            <div className='backdrop'/>
            <div
                className='wrapper'
                onClick={(e) => {
                    e.stopPropagation()
                    if (!isBackdropClickedRef.current) {
                        return
                    }
                    isBackdropClickedRef.current = false
                    props.onClose()
                }}
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        isBackdropClickedRef.current = true
                    }
                }}
            >
                <div
                    role='dialog'
                    className='dialog'
                >
                    <div className='section-1'>
                        <div className='title'>
                            <EditableArea
                                ref={titleRef}
                                className='title'
                                value={cardTitle}
                                placeholderText='Untitled'
                                onChange={(newTitle: string) => setTitle(newTitle)}
                                saveOnEsc={true}
                                onSave={saveTitle}
                                onCancel={() => setTitle(props.card?.title)}
                                readonly={props.readonly || !canEditBoardCards}
                                spellCheck={true}
                            />

                            <CardInList columns={props.column}/>
                        </div>

                        <div className='toolbar'>
                            <div>
                                {<h1 className='dialog-title'>{title || ''}</h1>}
                                {subtitle && <h5 className='dialog-subtitle'>{subtitle}</h5>}
                            </div>
                            <div className='toolbar--right'>
                                {toolbar && <div className='d-flex'>{toolbar}</div>}
                                {toolsMenu && <MenuWrapper>
                                    <IconButton
                                        size='medium'
                                        icon={<OptionsIcon/>}
                                    />
                                    {toolsMenu}
                                </MenuWrapper>
                                }
                                {
                                    !props.hideCloseButton &&
                                    <IconButton
                                        className='dialog__close'
                                        onClick={props.onClose}
                                        icon={<CloseIcon/>}
                                        title={closeDialogText}
                                        size='medium'
                                    />
                                }
                            </div>
                        </div>
                    </div>
                    <div className='section-2'>
                    {props.children}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default React.memo(CustomDialog)
