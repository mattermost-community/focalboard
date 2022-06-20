// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {FormattedMessage} from 'react-intl'

import {BlockIcons} from '../../blockIcons'
import {Board} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import {CommentBlock} from '../../blocks/commentBlock'
import {ContentBlock} from '../../blocks/contentBlock'
import {Permission} from '../../constants'
import {useHasCurrentBoardPermissions} from '../../hooks/permissions'
import mutator from '../../mutator'
import {setCurrent as setCurrentCard} from '../../store/cards'
import {useAppDispatch} from '../../store/hooks'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import Button from '../../widgets/buttons/button'
import {Focusable} from '../../widgets/editable'
import EditableArea from '../../widgets/editableArea'
import EmojiIcon from '../../widgets/icons/emoji'
import BlockIconSelector from '../blockIconSelector'

import './cardDetail.scss'
import CardDetailContents from './cardDetailContents'
import CardDetailContentsMenu from './cardDetailContentsMenu'
import {CardDetailProvider} from './cardDetailContext'
import CardDetailProperties from './cardDetailProperties'
import CommentsList from './commentsList'
import useImagePaste from './imagePaste'

export const OnboardingBoardTitle = 'Welcome to Boards!'
export const OnboardingCardTitle = 'Create a new card'

type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    card: Card
    comments: CommentBlock[]
    contents: Array<ContentBlock|ContentBlock[]>
    readonly: boolean
    hideTitle?: boolean
    hideProperties?: boolean
    hideComments?: boolean
}

const CardDetail = (props: Props): JSX.Element|null => {
    const {card, comments} = props
    const [title, setTitle] = useState(card.title)
    const [serverTitle, setServerTitle] = useState(card.title)
    const titleRef = useRef<Focusable>(null)
    const saveTitle = useCallback(() => {
        if (title !== card.title) {
            mutator.changeBlockTitle(props.board.id, card.id, card.title, title)
        }
    }, [card.title, title])
    const canEditBoardCards = useHasCurrentBoardPermissions([Permission.ManageBoardCards])

    const saveTitleRef = useRef<() => void>(saveTitle)
    saveTitleRef.current = saveTitle

    useImagePaste(props.board.id, card.id, card.fields.contentOrder)

    useEffect(() => {
        if (!title) {
            setTimeout(() => titleRef.current?.focus(), 300)
        }
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ViewCard, {board: props.board.id, view: props.activeView.id, card: card.id})
    }, [])

    useEffect(() => {
        if (serverTitle === title) {
            setTitle(card.title)
        }
        setServerTitle(card.title)
    }, [card.title, title])

    useEffect(() => {
        return () => {
            saveTitleRef.current && saveTitleRef.current()
        }
    }, [])

    const setRandomIcon = useCallback(() => {
        const newIcon = BlockIcons.shared.randomIcon()
        mutator.changeBlockIcon(props.board.id, card.id, card.fields.icon, newIcon)
    }, [card.id, card.fields.icon])

    const dispatch = useAppDispatch()
    useEffect(() => {
        dispatch(setCurrentCard(card.id))
    }, [card.id])

    if (!card) {
        return null
    }

    return (
        <>
            <div className='CardDetail content'>
                <BlockIconSelector
                    block={card}
                    size='l'
                    readonly={props.readonly || !canEditBoardCards}
                />
                {!props.hideTitle && !props.readonly && canEditBoardCards && !card.fields.icon &&
                    <div className='add-buttons'>
                        <Button
                            onClick={setRandomIcon}
                            icon={<EmojiIcon/>}
                        >
                            <FormattedMessage
                                id='CardDetail.add-icon'
                                defaultMessage='Add icon'
                            />
                        </Button>
                    </div>}

                {!props.hideTitle &&
                    <EditableArea
                        ref={titleRef}
                        className='title'
                        value={title}
                        placeholderText='Untitled'
                        onChange={(newTitle: string) => setTitle(newTitle)}
                        saveOnEsc={true}
                        onSave={saveTitle}
                        onCancel={() => setTitle(props.card.title)}
                        readonly={props.readonly || !canEditBoardCards}
                        spellCheck={true}
                    />
                }

                {/* Property list */}

                {!props.hideProperties &&
                    <CardDetailProperties
                        board={props.board}
                        card={props.card}
                        cards={props.cards}
                        activeView={props.activeView}
                        views={props.views}
                        readonly={props.readonly}
                    />
                }

                {/* Comments */}

                {!props.hideComments && <>
                    <hr/>
                    <CommentsList
                        comments={comments}
                        boardId={card.boardId}
                        cardId={card.id}
                        readonly={props.readonly || !canEditBoardCards}
                    />
                </>}
            </div>

            {/* Content blocks */}

            <div className='CardDetail content fullwidth content-blocks'>
                <CardDetailProvider card={card}>
                    <CardDetailContents
                        card={props.card}
                        contents={props.contents}
                        readonly={props.readonly || !canEditBoardCards}
                    />
                    {!props.readonly && canEditBoardCards && <CardDetailContentsMenu/>}
                </CardDetailProvider>
            </div>
        </>
    )
}

export default CardDetail
