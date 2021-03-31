// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

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
