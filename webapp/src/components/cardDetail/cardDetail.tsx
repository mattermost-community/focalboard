// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useRef, useState, Fragment, useMemo} from 'react'
import {FormattedMessage, useIntl, IntlShape} from 'react-intl'

import {BlockIcons} from '../../blockIcons'
import {Card} from '../../blocks/card'
import {BoardView} from '../../blocks/boardView'
import {Board} from '../../blocks/board'
import {CommentBlock} from '../../blocks/commentBlock'
import {ContentBlock} from '../../blocks/contentBlock'
import {Block, ContentBlockTypes, createBlock} from '../../blocks/block'
import mutator from '../../mutator'
import octoClient from '../../octoClient'
import Button from '../../widgets/buttons/button'
import {Focusable} from '../../widgets/editable'
import EditableArea from '../../widgets/editableArea'
import CompassIcon from '../../widgets/icons/compassIcon'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import BlockIconSelector from '../blockIconSelector'

import {useAppDispatch} from '../../store/hooks'
import {setCurrent as setCurrentCard} from '../../store/cards'
import {Permission} from '../../constants'
import {useHasCurrentBoardPermissions} from '../../hooks/permissions'
import BlocksEditor from '../blocksEditor/blocksEditor'
import {BlockData} from '../blocksEditor/blocks/types'

import CardSkeleton from '../../svg/card-skeleton'

import CommentsList from './commentsList'
import CardDetailProperties from './cardDetailProperties'
import useImagePaste from './imagePaste'

import './cardDetail.scss'

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
    onClose: () => void
}

async function addBlock(card: Card, intl: IntlShape, title: string, fields: any, contentType: ContentBlockTypes, afterBlockId: string): Promise<Block> {
    const block = createBlock()
    block.parentId = card.id
    block.boardId = card.boardId
    block.title = title
    block.type = contentType
    block.fields = {...block.fields, ...fields}

    const description = intl.formatMessage({id: 'CardDetail.addCardText', defaultMessage: 'add card text'})

    const afterRedo = async (newBlock: Block) => {
        const contentOrder = card.fields.contentOrder.slice()
        if (afterBlockId) {
            const idx = contentOrder.indexOf(afterBlockId)
            if (idx === -1) {
                contentOrder.push(newBlock.id)
            } else {
                contentOrder.splice(idx+1, 0, newBlock.id)
            }
        } else {
            contentOrder.push(newBlock.id)
        }
        await octoClient.patchBlock(card.boardId, card.id, {updatedFields: {contentOrder}})
    }

    const beforeUndo = async () => {
        const contentOrder = card.fields.contentOrder.slice()
        await octoClient.patchBlock(card.boardId, card.id, {updatedFields: {contentOrder}})
    }

    return mutator.insertBlock(block.boardId, block, description, afterRedo, beforeUndo)
}

function moveBlock(boardId: string, blockId: string, dstBlockId: string): void {
    // TODO: Make this a mutation
    octoClient.moveBlockTo(boardId, blockId, "after", dstBlockId)
}


const CardDetail = (props: Props): JSX.Element|null => {
    const {card, comments} = props
    const {limited} = card
    const [title, setTitle] = useState(card.title)
    const [serverTitle, setServerTitle] = useState(card.title)
    const titleRef = useRef<Focusable>(null)
    const saveTitle = useCallback(() => {
        if (title !== card.title) {
            mutator.changeBlockTitle(props.board.id, card.id, card.title, title)
        }
    }, [card.title, title])
    const canEditBoardCards = useHasCurrentBoardPermissions([Permission.ManageBoardCards])
    const canCommentBoardCards = useHasCurrentBoardPermissions([Permission.CommentBoardCards])

    const saveTitleRef = useRef<() => void>(saveTitle)
    saveTitleRef.current = saveTitle
    const intl = useIntl()

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

    console.log(props.contents)
    const blocks = useMemo(() => props.contents.flatMap((value: Block | Block[]): BlockData<any> => {
        let v: Block = Array.isArray(value) ? value[0] : value

        let data: any = v?.title
        if (v?.type === 'image') {
            data = v?.fields.fileId
        }

        if (v?.type === 'checkbox') {
            data = {
                value: v?.title,
                checked: v?.fields.value,
            }
        }

        return {
            id: v?.id,
            value: data,
            contentType: v?.type,
        }
    }), [props.contents])
    console.log(blocks)

    return (
        <>
            <div className={`CardDetail content${limited ? ' is-limited' : ''}`}>
                <BlockIconSelector
                    block={card}
                    size='l'
                    readonly={props.readonly || !canEditBoardCards || limited}
                />
                {!props.readonly && canEditBoardCards && !card.fields.icon &&
                    <div className='add-buttons'>
                        <Button
                            emphasis='default'
                            size='small'
                            onClick={setRandomIcon}
                            icon={
                                <CompassIcon
                                    icon='emoticon-outline'
                                />}

                        >
                            <FormattedMessage
                                id='CardDetail.add-icon'
                                defaultMessage='Add icon'
                            />
                        </Button>
                    </div>}

                <EditableArea
                    ref={titleRef}
                    className='title'
                    value={title}
                    placeholderText='Untitled'
                    onChange={(newTitle: string) => setTitle(newTitle)}
                    saveOnEsc={true}
                    onSave={saveTitle}
                    onCancel={() => setTitle(props.card.title)}
                    readonly={props.readonly || !canEditBoardCards || limited}
                    spellCheck={true}
                />

                {/* Hidden (limited) card copy + CTA */}

                {limited && <div className='CardDetail__limited-wrapper'>
                    <CardSkeleton
                        className='CardDetail__limited-bg'
                    />
                    <p className='CardDetail__limited-title'>
                        <FormattedMessage
                            id='CardDetail.limited-title'
                            defaultMessage='This card is hidden'
                        />
                    </p>
                    <p className='CardDetail__limited-body'>
                        <FormattedMessage
                            id='CardDetail.limited-body'
                            defaultMessage='Upgrade to our Professional or Enterprise plan to view archived cards, have unlimited views per boards, unlimited cards and more.'
                        />
                        <br/>
                        <a
                            className='CardDetail__limited-link'
                            role='button'
                            onClick={() => {
                                props.onClose();
                                (window as any).openPricingModal()({trackingLocation: 'boards > learn_more_about_our_plans_click'})
                            }}
                        >
                            <FormattedMessage
                                id='CardDetial.limited-link'
                                defaultMessage='Learn more about our plans.'
                            />
                        </a>
                    </p>
                    <Button
                        className='CardDetail__limited-button'
                        onClick={() => {
                            props.onClose();
                            (window as any).openPricingModal()({trackingLocation: 'boards > upgrade_click'})
                        }}
                        emphasis='primary'
                        size='large'
                    >
                        {intl.formatMessage({id: 'CardDetail.limited-button', defaultMessage: 'Upgrade'})}
                    </Button>
                </div>}

                {/* Property list */}

                {!limited &&
                <CardDetailProperties
                    board={props.board}
                    card={props.card}
                    cards={props.cards}
                    activeView={props.activeView}
                    views={props.views}
                    readonly={props.readonly}
                />}

                {/* Comments */}

                {!limited && <Fragment>
                    <hr/>
                    <CommentsList
                        comments={comments}
                        boardId={card.boardId}
                        cardId={card.id}
                        readonly={props.readonly || !canCommentBoardCards}
                    />
                </Fragment>}
            </div>

            {/* Content blocks */}

            {!limited && <div className='CardDetail content fullwidth content-blocks'>
                <BlocksEditor
                    blocks={blocks}
                    onBlockCreated={(block: any, afterBlock: any): any => {
                        if (block.contentType === 'text' && block.value === '') {
                            return null
                        }
                        if (block.contentType === 'checkbox') {
                            addBlock(card, intl, block.value.value, {value: block.value.checked}, block.contentType, afterBlock?.id)
                        } else {
                            addBlock(card, intl, block.value, {}, block.contentType, afterBlock?.id)
                        }
                        return block
                    }}
                    onBlockModified={(block: any): BlockData<any>|null => {
                        const originalContentBlock = props.contents.flatMap((b) => b).find((b) => b.id === block.id)
                        if (!originalContentBlock) {
                            return null
                        }

                        if (block.contentType === 'text' && block.value === '') {
                            const description = intl.formatMessage({id: 'ContentBlock.DeleteAction', defaultMessage: 'delete'})

                            mutator.deleteBlock(originalContentBlock, description)
                            return null
                        }
                        const newBlock = {
                            ...originalContentBlock,
                            title: block.value,
                        }

                        if (block.contentType === 'checkbox') {
                            newBlock.title = block.value.value
                            newBlock.fields = {...newBlock.fields, value: block.value.checked}
                        }
                        mutator.updateBlock(card.boardId, newBlock, originalContentBlock, intl.formatMessage({id: 'ContentBlock.editCardText', defaultMessage: 'edit card content'}))
                        return block
                    }}
                    onBlockMoved={(block: any, afterBlock: any) => {
                        console.log(block, afterBlock)
                        moveBlock(card.boardId, block.id, afterBlock.id)
                    }}
                />
            </div>}
        </>
    )
}
                // <CardDetailProvider card={card}>
                //     <CardDetailContents
                //         card={props.card}
                //         contents={props.contents}
                //         readonly={props.readonly || !canEditBoardCards}
                //     />
                //     {!props.readonly && canEditBoardCards && <CardDetailContentsMenu/>}
                // </CardDetailProvider>

export default CardDetail
