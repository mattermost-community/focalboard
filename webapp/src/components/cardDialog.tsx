// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Board} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {Card} from '../blocks/card'
import {sendFlashMessage} from '../components/flashMessages'
import mutator from '../mutator'
import octoClient from '../octoClient'
import {getCardAttachments, updateAttachments, updateUploadPrecent} from '../store/attachments'
import {getCard} from '../store/cards'
import {getCardComments} from '../store/comments'
import {getCardContents} from '../store/contents'
import {useAppDispatch, useAppSelector} from '../store/hooks'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import {Utils} from '../utils'
import CompassIcon from '../widgets/icons/compassIcon'
import Menu from '../widgets/menu'

import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../components/confirmationDialogBox'

import Button from '../widgets/buttons/button'

import {AttachmentBlock, createAttachmentBlock} from '../blocks/attachmentBlock'
import {Block, createBlock} from '../blocks/block'
import {Permission} from '../constants'

import BoardPermissionGate from './permissions/boardPermissionGate'

import CardDetail from './cardDetail/cardDetail'
import Dialog from './dialog'

import CardActionsMenu from './cardActionsMenu/cardActionsMenu'
import './cardDialog.scss'

type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    cardId: string
    onClose: () => void
    showCard: (cardId?: string) => void
    readonly: boolean
}

const CardDialog = (props: Props): JSX.Element => {
    const {board, activeView, cards, views} = props
    const card = useAppSelector(getCard(props.cardId))
    const contents = useAppSelector(getCardContents(props.cardId))
    const comments = useAppSelector(getCardComments(props.cardId))
    const attachments = useAppSelector(getCardAttachments(props.cardId))
    const intl = useIntl()
    const dispatch = useAppDispatch()
    const isTemplate = card && card.fields.isTemplate

    const [showConfirmationDialogBox, setShowConfirmationDialogBox] = useState<boolean>(false)
    const makeTemplateClicked = async () => {
        if (!card) {
            Utils.assertFailure('card')
            return
        }

        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.AddTemplateFromCard, {board: props.board.id, view: activeView.id, card: props.cardId})
        await mutator.duplicateCard(
            props.cardId,
            board.id,
            card.fields.isTemplate,
            intl.formatMessage({id: 'Mutator.new-template-from-card', defaultMessage: 'new template from card'}),
            true,
            {},
            async (newCardId) => {
                props.showCard(newCardId)
            },
            async () => {
                props.showCard(undefined)
            },
        )
    }
    const handleDeleteCard = async () => {
        if (!card) {
            Utils.assertFailure()
            return
        }
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteCard, {board: props.board.id, view: props.activeView.id, card: card.id})
        await mutator.deleteBlock(card, 'delete card')
        props.onClose()
    }

    const confirmDialogProps: ConfirmationDialogBoxProps = {
        heading: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-heading', defaultMessage: 'Confirm card delete!'}),
        confirmButtonText: intl.formatMessage({id: 'CardDialog.delete-confirmation-dialog-button-text', defaultMessage: 'Delete'}),
        onConfirm: handleDeleteCard,
        onClose: () => {
            setShowConfirmationDialogBox(false)
        },
    }

    const handleDeleteButtonOnClick = () => {
        // use may be renaming a card title
        // and accidently delete the card
        // so adding des
        if (card?.title === '' && card?.fields.contentOrder.length === 0) {
            handleDeleteCard()
            return
        }

        setShowConfirmationDialogBox(true)
    }

    const menu = (
        <CardActionsMenu
            cardId={props.cardId}
            boardId={board.id}
            onClickDelete={handleDeleteButtonOnClick}
        >
            {!isTemplate &&
            <BoardPermissionGate permissions={[Permission.ManageBoardProperties]}>
                <Menu.Text
                    id='makeTemplate'
                    icon={
                        <CompassIcon
                            icon='plus'
                        />}
                    name='New template from card'
                    onClick={makeTemplateClicked}
                />
            </BoardPermissionGate>
            }
        </CardActionsMenu>
    )

    const removeUploadingAttachment = (uploadingBlock: Block) => {
        uploadingBlock.deleteAt = 1
        const removeUploadingAttachmentBlock = createAttachmentBlock(uploadingBlock)
        dispatch(updateAttachments([removeUploadingAttachmentBlock]))
    }

    const selectAttachment = (boardId: string) => {
        return new Promise<AttachmentBlock>(
            (resolve) => {
                Utils.selectLocalFile(async (attachment) => {
                    const uploadingBlock = createBlock()
                    uploadingBlock.title = attachment.name
                    uploadingBlock.fields.fileId = attachment.name
                    uploadingBlock.boardId = boardId
                    if (card) {
                        uploadingBlock.parentId = card.id
                    }
                    const attachmentBlock = createAttachmentBlock(uploadingBlock)
                    attachmentBlock.isUploading = true
                    dispatch(updateAttachments([attachmentBlock]))
                    sendFlashMessage({content: intl.formatMessage({id: 'AttachmentBlock.upload', defaultMessage: 'Attachment uploading.'}), severity: 'normal'})
                    const xhr = await octoClient.uploadAttachment(boardId, attachment)
                    if (xhr) {
                        xhr.upload.onprogress = (event) => {
                            const percent = Math.floor((event.loaded / event.total) * 100)
                            dispatch(updateUploadPrecent({
                                blockId: attachmentBlock.id,
                                uploadPercent: percent,
                            }))
                        }

                        xhr.onload = () => {
                            if (xhr.status === 200 && xhr.readyState === 4) {
                                const json = JSON.parse(xhr.response)
                                const fileId = json.fileId
                                if (fileId) {
                                    removeUploadingAttachment(uploadingBlock)
                                    const block = createAttachmentBlock()
                                    block.fields.fileId = fileId || ''
                                    block.title = attachment.name
                                    sendFlashMessage({content: intl.formatMessage({id: 'AttachmentBlock.uploadSuccess', defaultMessage: 'Attachment uploaded successfull.'}), severity: 'normal'})
                                    resolve(block)
                                } else {
                                    removeUploadingAttachment(uploadingBlock)
                                    sendFlashMessage({content: intl.formatMessage({id: 'AttachmentBlock.failed', defaultMessage: 'Unable to upload the file. Attachment size limit reached.'}), severity: 'normal'})
                                }
                            }
                        }
                    }
                },
                '')
            },
        )
    }

    const addElement = async () => {
        if (!card) {
            return
        }
        const block = await selectAttachment(board.id)
        block.parentId = card.id
        block.boardId = card.boardId
        const typeName = block.type
        const description = intl.formatMessage({id: 'AttachmentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
        await mutator.insertBlock(block.boardId, block, description)
    }

    const deleteBlock = useCallback(async (block: Block) => {
        if (!card) {
            return
        }
        const description = intl.formatMessage({id: 'AttachmentBlock.DeleteAction', defaultMessage: 'delete'})
        await mutator.deleteBlock(block, description)
        sendFlashMessage({content: intl.formatMessage({id: 'AttachmentBlock.delete', defaultMessage: 'Attachment Deleted Successfully.'}), severity: 'normal'})
    }, [card?.boardId, card?.id, card?.fields.contentOrder])

    const attachBtn = (): React.ReactNode => {
        return (
            <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
                <Button
                    icon={<CompassIcon icon='paperclip'/>}
                    className='cardFollowBtn cardFollowBtn--attach'
                    emphasis='gray'
                    size='medium'
                    onClick={addElement}
                >
                    {intl.formatMessage({id: 'CardDetail.Attach', defaultMessage: 'Attach'})}
                </Button>
            </BoardPermissionGate>
        )
    }

    return (
        <>
            <Dialog
                title={<div/>}
                className='cardDialog'
                onClose={props.onClose}
                toolsMenu={!props.readonly && !card?.limited && menu}
                toolbar={attachBtn()}
            >
                {isTemplate &&
                    <div className='banner'>
                        <FormattedMessage
                            id='CardDialog.editing-template'
                            defaultMessage="You're editing a template."
                        />
                    </div>}

                {card &&
                    <CardDetail
                        board={board}
                        activeView={activeView}
                        views={views}
                        cards={cards}
                        card={card}
                        contents={contents}
                        comments={comments}
                        attachments={attachments}
                        readonly={props.readonly}
                        onClose={props.onClose}
                        onDelete={deleteBlock}
                        addAttachment={addElement}
                    />}

                {!card &&
                    <div className='banner error'>
                        <FormattedMessage
                            id='CardDialog.nocard'
                            defaultMessage="This card doesn't exist or is inaccessible."
                        />
                    </div>}
            </Dialog>

            {showConfirmationDialogBox && <ConfirmationDialogBox dialogBox={confirmDialogProps}/>}
        </>
    )
}

export default CardDialog
