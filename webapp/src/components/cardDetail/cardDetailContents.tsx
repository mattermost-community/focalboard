// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock} from '../../blocks/contentBlock'
import {MutableTextBlock} from '../../blocks/textBlock'
import mutator from '../../mutator'
import {CardTree} from '../../viewModel/cardTree'
import {Card} from '../../blocks/card'

import ContentBlock from '../contentBlock'
import {MarkdownEditor} from '../markdownEditor'

type Props = {
    cardTree: CardTree
    intl: IntlShape
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

function moveBlock(card: Card, srcBlock: IContentBlock, dstBlock: IContentBlock, intl: IntlShape): void {
    let contentOrder = card.contentOrder.slice()
    const isDraggingDown = contentOrder.indexOf(srcBlock.id) <= contentOrder.indexOf(dstBlock.id)
    contentOrder = contentOrder.filter((id) => srcBlock.id !== id)
    let destIndex = contentOrder.indexOf(dstBlock.id)
    if (isDraggingDown) {
        destIndex += 1
    }
    contentOrder.splice(destIndex, 0, srcBlock.id)

    mutator.performAsUndoGroup(async () => {
        const description = intl.formatMessage({id: 'CardDetail.moveContent', defaultMessage: 'move card content'})
        await mutator.changeCardContentOrder(card, contentOrder, description)
    })
}

const CardDetailContents = React.memo((props: Props) => {
    const {cardTree} = props
    if (!cardTree) {
        return null
    }
    const {card} = cardTree

    if (cardTree.contents.length > 0) {
        return (
            <div className='octo-content'>
                {cardTree.contents.map((block) => (
                    <ContentBlock
                        key={block.id}
                        block={block}
                        card={card}
                        contents={cardTree.contents}
                        readonly={props.readonly}
                        onDrop={(src, dst) => moveBlock(card, src, dst, props.intl)}
                    />
                ))}
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
                                addTextBlock(card, props.intl, text)
                            }
                        }}
                    />
                }
            </div>
        </div>
    )
})

export default injectIntl(CardDetailContents)
