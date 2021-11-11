// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Board} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import {getCard} from '../store/cards'
import {getCardComments} from '../store/comments'
import {getCardContents} from '../store/contents'
import {useAppSelector} from '../store/hooks'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import {Utils} from '../utils'
import DeleteIcon from '../widgets/icons/delete'
import LinkIcon from '../widgets/icons/Link'
import Menu from '../widgets/menu'

import CardDetail from './cardDetail/cardDetail'
import Dialog from './dialog'
import {sendFlashMessage} from './flashMessages'

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
    const intl = useIntl()

    const makeTemplateClicked = async () => {
        if (!card) {
            Utils.assertFailure('card')
            return
        }

        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.AddTemplateFromCard, {board: props.board.id, view: activeView.id, card: props.cardId})
        await mutator.duplicateCard(
            props.cardId,
            board,
            intl.formatMessage({id: 'Mutator.new-template-from-card', defaultMessage: 'new template from card'}),
            true,
            async (newCardId) => {
                props.showCard(newCardId)
            },
            async () => {
                props.showCard(undefined)
            },
        )
    }

    const menu = (
        <Menu position='left'>
            <Menu.Text
                id='delete'
                icon={<DeleteIcon/>}
                name='Delete'
                onClick={async () => {
                    if (!card) {
                        Utils.assertFailure()
                        return
                    }
                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteCard, {board: props.board.id, view: props.activeView.id, card: props.cardId})
                    await mutator.deleteBlock(card, 'delete card')
                    props.onClose()
                }}
            />
            <Menu.Text
                icon={<LinkIcon/>}
                id='copy'
                name={intl.formatMessage({id: 'CardDialog.copyLink', defaultMessage: 'Copy link'})}
                onClick={() => {
                    let cardLink = window.location.href

                    if (!cardLink.includes(props.cardId)) {
                        cardLink += `/${props.cardId}`
                    }

                    Utils.copyTextToClipboard(cardLink)
                    sendFlashMessage({content: intl.formatMessage({id: 'CardDialog.copiedLink', defaultMessage: 'Copied!'}), severity: 'high'})
                }}
            />
            {(card && !card.fields.isTemplate) &&
                <Menu.Text
                    id='makeTemplate'
                    name='New template from card'
                    onClick={makeTemplateClicked}
                />
            }
        </Menu>
    )
    return (
        <Dialog
            onClose={props.onClose}
            toolsMenu={!props.readonly && menu}
        >
            {card && card.fields.isTemplate &&
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
                    readonly={props.readonly}
                />}

            {!card &&
                <div className='banner error'>
                    <FormattedMessage
                        id='CardDialog.nocard'
                        defaultMessage="This card doesn't exist or is inaccessible."
                    />
                </div>}
        </Dialog>
    )
}

export default CardDialog
