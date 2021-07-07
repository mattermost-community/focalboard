// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl, IntlShape} from 'react-intl'

import {IContentBlockWithCords} from '../../blocks/contentBlock'
import {MutableTextBlock} from '../../blocks/textBlock'
import mutator from '../../mutator'
import {CardTree} from '../../viewModel/cardTree'
import {Card} from '../../blocks/card'
import {useSortableWithGrip} from '../../hooks/sortable'

import ContentBlock from '../contentBlock'
import {MarkdownEditor} from '../markdownEditor'

export type Position = 'left' | 'right' | 'above' | 'below' | 'aboveRow' | 'belowRow'

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

function moveBlock(card: Card, srcBlock: IContentBlockWithCords, dstBlock: IContentBlockWithCords, intl: IntlShape, moveTo: Position): void {
    const contentOrder = card.contentOrder.slice()

    const srcBlockId = srcBlock.block.id
    const dstBlockId = dstBlock.block.id

    let srcBlockX = srcBlock.cords.x
    let dstBlockX = dstBlock.cords.x

    let srcBlockY = srcBlock.cords.y
    if (typeof srcBlockY !== 'number') {
        srcBlockY = -1
    }

    let dstBlockY = dstBlock.cords.y
    if (typeof dstBlockY !== 'number') {
        dstBlockY = -1
    }

    if (srcBlockId === dstBlockId) {
        return
    }

    // Delete Src Block
    if (srcBlockY > -1) {
        (contentOrder[srcBlockX] as string[]).splice(srcBlockY, 1)

        if (contentOrder[srcBlockX].length === 1) {
            contentOrder.splice(srcBlockX, 1, contentOrder[srcBlockX][0])
        }

    } else {
        contentOrder.splice(srcBlockX, 1)

        if (dstBlockX > srcBlockX) {
            dstBlockX -= 1
        }
    }

    if (moveTo === 'right') {
        if (dstBlockY > -1) {

            // Get an updated dst y cord incase delete above changed it
            dstBlockY = contentOrder[dstBlockX].indexOf(dstBlockId);

            (contentOrder[dstBlockX] as string[]).splice(dstBlockY + 1, 0, srcBlockId)
        } else {
            contentOrder.splice(dstBlockX, 1, [dstBlockId, srcBlockId]);
        }
    } else if (moveTo === 'left') {
        if (dstBlockY > -1) {
            // Get an updated dst y cord incase delete above changed it
            dstBlockY = contentOrder[dstBlockX].indexOf(dstBlockId);
            (contentOrder[dstBlockX] as string[]).splice(dstBlockY, 0, srcBlockId)
        } else {
            contentOrder.splice(dstBlockX, 1, [srcBlockId, dstBlockId]);
        }
    } else if (moveTo === 'aboveRow') {
        contentOrder.splice(dstBlockX, 0, srcBlockId)
    } else if (moveTo === 'belowRow') {
        contentOrder.splice(dstBlockX + 1, 0, srcBlockId)
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
                {cardTree.contents.map((block, x) => {
                    // const [, isOver,, itemRef] = useSortableWithGrip('content', {block: block, cords: {x: x}}, true, (src, dst) =>  moveBlock(card, src, dst, intl, 'aboveRow'))
                    // const [, isOver2,, itemRef2] = useSortableWithGrip('content', {block: block, cords: {x: x}}, true, (src, dst) =>  moveBlock(card, src, dst, intl, 'belowRow'))


                    if (Array.isArray(block)) {
                        return (
                            <div
                                key={block[0].id + '0'}
                            >
                                {/* <div
                                    className={`addToRow ${isOver ? 'dragover' : ''}`}
                                    style={{width: '94%', height: '10px', marginLeft: '48px'}}
                                />  */}
                                <div
                                    style={{display: 'flex'}}
                                >
        
                                    {block.map((b, y) => (
                                        <ContentBlock
                                            key={b.id}
                                            block={b}
                                            card={card}
                                            readonly={props.readonly}
                                            width={(1/block.length) * 100}
                                            onDrop={(src, dst, moveTo) => moveBlock(card, src, dst, intl, moveTo)}
                                            cords={{x: x, y: y}}
                                        />
                                    ))}
                                </div>
                            </div>
                   
                            
                        )
                    }

                    return (
                        <div key={block.id + '0'}>
                            {/* <div
                                className={`addToRow ${isOver ? 'dragover' : ''}`}
                                style={{width: '94%', height: '10px', marginLeft: '48px'}}
                            />  */}
                            <ContentBlock
                                key={block.id}
                                block={block}
                                card={card}
                                readonly={props.readonly}
                                onDrop={(src, dst, moveTo) => moveBlock(card, src, dst, intl, moveTo)}
                                cords={{x: x}}
                            />
                        </div>
       
                    
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
