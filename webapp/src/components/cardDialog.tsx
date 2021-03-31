// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import mutator from '../mutator'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import {CardTree, MutableCardTree} from '../viewModel/cardTree'
import DeleteIcon from '../widgets/icons/delete'
import Menu from '../widgets/menu'

import useCardListener from '../hooks/cardListener'

import CardDetail from './cardDetail/cardDetail'
import Dialog from './dialog'

type Props = {
    boardTree: BoardTree
    cardId: string
    onClose: () => void
    showCard: (cardId?: string) => void
    intl: IntlShape
    readonly: boolean
}

const CardDialog = (props: Props) => {
    const [syncComplete, setSyncComplete] = useState(false)
    const [cardTree, setCardTree] = useState<CardTree>()
    useCardListener(
        [props.cardId],
        async (blocks) => {
            Utils.log(`cardListener.onChanged: ${blocks.length}`)
            const newCardTree = cardTree ? MutableCardTree.incrementalUpdate(cardTree, blocks) : await MutableCardTree.sync(props.cardId)
            setCardTree(newCardTree)
            setSyncComplete(true)
        },
        async () => {
            Utils.log('cardListener.onReconnect')
            const newCardTree = await MutableCardTree.sync(props.cardId)
            setCardTree(newCardTree)
            setSyncComplete(true)
        },
    )

    const makeTemplateClicked = async () => {
        if (!cardTree) {
            Utils.assertFailure('cardTree')
            return
        }

        await mutator.duplicateCard(
            cardTree.card.id,
            props.intl.formatMessage({id: 'Mutator.new-template-from-card', defaultMessage: 'new template from card'}),
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
                    const card = cardTree?.card
                    if (!card) {
                        Utils.assertFailure()
                        return
                    }
                    await mutator.deleteBlock(card, 'delete card')
                    props.onClose()
                }}
            />
            {(cardTree && !cardTree.card.isTemplate) &&
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
            {(cardTree?.card.isTemplate) &&
                <div className='banner'>
                    <FormattedMessage
                        id='CardDialog.editing-template'
                        defaultMessage="You're editing a template"
                    />
                </div>
            }
            {cardTree &&
                <CardDetail
                    boardTree={props.boardTree}
                    cardTree={cardTree}
                    readonly={props.readonly}
                />
            }
            {(!cardTree && syncComplete) &&
                <div className='banner error'>
                    <FormattedMessage
                        id='CardDialog.nocard'
                        defaultMessage="This card doesn't exist or is inaccessible"
                    />
                </div>
            }
        </Dialog>
    )
}

export default injectIntl(CardDialog)
