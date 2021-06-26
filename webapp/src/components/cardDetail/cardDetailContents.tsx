// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl, IntlShape} from 'react-intl'

import {IContentBlock} from '../../blocks/contentBlock'
import {MutableTextBlock} from '../../blocks/textBlock'
import mutator from '../../mutator'
import {CardTree} from '../../viewModel/cardTree'
import {Card} from '../../blocks/card'

import ContentBlock from '../contentBlock'
import {MarkdownEditor} from '../markdownEditor'

type Props = {
    cardTree: CardTree
    readonly: boolean
}

function addTextBlock(card: Card, intl: IntlShape, text: string): void {
    const block = new MutableTextBlock()
    block.parentId = card.id
    block.rootId = card.rootId
    block.title = text

    const contentOrder = card.contentOrder.slice()
    contentOrder.push(block.id)
    mutator.performAsUndoGroup(async () => {
        const description = intl.formatMessage({id: 'CardDetail.addCardText', defaultMessage: 'add card text'})
        await mutator.insertBlock(block, description)
        await mutator.changeCardContentOrder(card, contentOrder, description)
    })
}

function moveBlock(card: Card, srcBlock: IContentBlock, dstBlock: IContentBlock, intl: IntlShape, isParallel = false): void {
    const contentOrder = card.contentOrder.slice()
    let idxSrcBlock = contentOrder.indexOf(srcBlock.id)
    let idxDstBlock = contentOrder.indexOf(dstBlock.id)
    let idxSrcBlockColumn = -1
    let idxDstBlockColumn = -1

    // Block is in a row array with other blocks so we gotta search
    if (idxSrcBlock === -1) {
        contentOrder.find((item, idx) => {
            if (Array.isArray(item) && item.includes(srcBlock.id)) {
                idxSrcBlock = idx
                idxSrcBlockColumn = item.indexOf(srcBlock.id)
                return true
            }
            return false
        })
    }

    if (idxDstBlock === -1) {
        contentOrder.find((item, idx) => {
            if (Array.isArray(item) && item.includes(dstBlock.id)) {
                idxDstBlock = idx
                idxDstBlockColumn = item.indexOf(dstBlock.id)
                return true
            }
            return false
        })
    }

    if (isParallel) {
        if (srcBlock.id === dstBlock.id) {
            return
        }

        (idxDstBlockColumn > -1 &&
            (contentOrder[idxDstBlock] as string[]).splice(idxDstBlockColumn + 1, 0, srcBlock.id)) ||
            contentOrder.splice(idxDstBlock, 1, [dstBlock.id, srcBlock.id]);

        (idxSrcBlockColumn > -1 &&
            (contentOrder[idxSrcBlock] as string[]).splice(idxSrcBlockColumn, 1)) ||
            contentOrder.splice(idxSrcBlock, 1)
    } else {
        const srcBlockCopy = contentOrder[idxSrcBlock]
        contentOrder.splice(idxSrcBlock, 1)
        contentOrder.splice(idxDstBlock, 0, srcBlockCopy)
    }

    mutator.performAsUndoGroup(async () => {
        const description = intl.formatMessage({id: 'CardDetail.moveContent', defaultMessage: 'move card content'})
        await mutator.changeCardContentOrder(card, contentOrder, description)
    })
}

const CardDetailContents = React.memo((props: Props) => {
    const intl = useIntl()
    const {cardTree} = props
    if (!cardTree) {
        return null
    }
    const {card} = cardTree
    if (cardTree.contents.length > 0) {
        return (
            <div className='octo-content'>
                {cardTree.contents.map((block) => {
                    if (Array.isArray(block)) {
                        return (
                            <div
                                key={block[0].id + block[1].id}
                                style={{display: 'flex'}}
                            >
                                {block.map((b) => (
                                    <ContentBlock
                                        key={b.id}
                                        block={b}
                                        card={card}
                                        readonly={props.readonly}
                                        onDrop={(src, dst, isParallel) => moveBlock(card, src, dst, intl, isParallel)}
                                    />
                                ))}
                            </div>
                        )
                    }

                    return (
                        <ContentBlock
                            key={block.id}
                            block={block}
                            card={card}
                            readonly={props.readonly}
                            onDrop={(src, dst, isParallel) => moveBlock(card, src, dst, intl, isParallel)}
                        />
                    )
                })}
            </div>
        )
    }
    return (
        <div className='octo-content'>
            <div className='octo-block'>
                <div className='octo-block-margin'/>
                {!props.readonly &&
                    <MarkdownEditor
                        text=''
                        placeholderText='Add a description...'
                        onBlur={(text) => {
                            if (text) {
                                addTextBlock(card, intl, text)
                            }
                        }}
                    />
                }
            </div>
        </div>
    )
})

export default CardDetailContents
