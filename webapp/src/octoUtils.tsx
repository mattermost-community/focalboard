// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {IBlock, MutableBlock} from './blocks/block'
import {IPropertyTemplate, MutableBoard} from './blocks/board'
import {MutableBoardView} from './blocks/boardView'
import {Card, MutableCard} from './blocks/card'
import {MutableCommentBlock} from './blocks/commentBlock'
import {MutableImageBlock} from './blocks/imageBlock'
import {IOrderedBlock} from './blocks/orderedBlock'
import {MutableTextBlock} from './blocks/textBlock'
import {Editable} from './components/editable'
import {Menu} from './menu'
import mutator from './mutator'
import {Utils} from './utils'

class OctoUtils {
    static propertyDisplayValue(block: IBlock, propertyValue: string | undefined, propertyTemplate: IPropertyTemplate): string | undefined {
        let displayValue: string
        switch (propertyTemplate.type) {
        case 'select': {
            // The property value is the id of the template
            if (propertyValue) {
                const option = propertyTemplate.options.find((o) => o.id === propertyValue)
                if (!option) {
                    Utils.assertFailure()
                }
                displayValue = option?.value || '(Unknown)'
            }
            break
        }
        case 'createdTime': {
            displayValue = Utils.displayDateTime(new Date(block.createAt))
            break
        }
        case 'updatedTime': {
            displayValue = Utils.displayDateTime(new Date(block.updateAt))
            break
        }
        default:
            displayValue = propertyValue
        }

        return displayValue
    }

    static propertyValueReadonlyElement(card: Card, propertyTemplate: IPropertyTemplate, emptyDisplayValue = 'Empty'): JSX.Element {
        return this.propertyValueElement(true, card, propertyTemplate, emptyDisplayValue)
    }

    static propertyValueEditableElement(card: Card, propertyTemplate: IPropertyTemplate, emptyDisplayValue?: string): JSX.Element {
        return this.propertyValueElement(false, card, propertyTemplate, emptyDisplayValue)
    }

    private static propertyValueElement(readOnly: boolean, card: Card, propertyTemplate: IPropertyTemplate, emptyDisplayValue = 'Empty'): JSX.Element {
        const propertyValue = card.properties[propertyTemplate.id]
        const displayValue = OctoUtils.propertyDisplayValue(card, propertyValue, propertyTemplate)
        const finalDisplayValue = displayValue || emptyDisplayValue

        let propertyColorCssClassName: string
        if (propertyValue && propertyTemplate.type === 'select') {
            const cardPropertyValue = propertyTemplate.options.find((o) => o.id === propertyValue)
            if (cardPropertyValue) {
                propertyColorCssClassName = cardPropertyValue.color
            }
        }

        let element: JSX.Element

        if (propertyTemplate.type === 'select') {
            let className = 'octo-button octo-propertyvalue'
            if (!displayValue) {
                className += ' empty'
            }

            const showMenu = (clickedElement: HTMLElement) => {
                if (propertyTemplate.options.length < 1) {
                    return
                }

                const menu = Menu.shared
                menu.options = [{id: '', name: '<Empty>'}]
                menu.options.push(...propertyTemplate.options.map((o) => ({id: o.id, name: o.value})))
                menu.onMenuClicked = (optionId) => {
                    mutator.changePropertyValue(card, propertyTemplate.id, optionId)
                }
                menu.showAtElement(clickedElement)
            }

            element = (
                <div
                    key={propertyTemplate.id}
                    className={`${className} ${propertyColorCssClassName}`}
                    tabIndex={0}
                    onClick={!readOnly ? (e) => {
                        showMenu(e.target as HTMLElement)
                    } : undefined}
                    onKeyDown={!readOnly ? (e) => {
                        if (e.keyCode === 13) {
                            showMenu(e.target as HTMLElement)
                        }
                    } : undefined}
                    onFocus={!readOnly ? () => {
                        Menu.shared.hide()
                    } : undefined}
                >
                    {finalDisplayValue}
                </div>)
        } else if (propertyTemplate.type === 'text' || propertyTemplate.type === 'number') {
            if (!readOnly) {
                element = (<Editable
                    key={propertyTemplate.id}
                    className='octo-propertyvalue'
                    placeholderText='Empty'
                    text={displayValue}
                    onChanged={(text) => {
                        mutator.changePropertyValue(card, propertyTemplate.id, text)
                    }}
                />)
            } else {
                element = (<div
                    key={propertyTemplate.id}
                    className='octo-propertyvalue'
                >{displayValue}</div>)
            }
        } else {
            element = (<div
                key={propertyTemplate.id}
                className='octo-propertyvalue'
                       >{finalDisplayValue}</div>)
        }

        return element
    }

    static getOrderBefore(block: IOrderedBlock, blocks: readonly IOrderedBlock[]): number {
        const index = blocks.indexOf(block)
        if (index === 0) {
            return block.order / 2
        }
        const previousBlock = blocks[index - 1]
        return (block.order + previousBlock.order) / 2
    }

    static getOrderAfter(block: IOrderedBlock, blocks: readonly IOrderedBlock[]): number {
        const index = blocks.indexOf(block)
        if (index === blocks.length - 1) {
            return block.order + 1000
        }
        const nextBlock = blocks[index + 1]
        return (block.order + nextBlock.order) / 2
    }

    static hydrateBlock(block: IBlock): MutableBlock {
        switch (block.type) {
        case 'board': { return new MutableBoard(block) }
        case 'view': { return new MutableBoardView(block) }
        case 'card': { return new MutableCard(block) }
        case 'text': { return new MutableTextBlock(block) }
        case 'image': { return new MutableImageBlock(block) }
        case 'comment': { return new MutableCommentBlock(block) }
        default: {
            Utils.assertFailure(`Can't hydrate unknown block type: ${block.type}`)
            return new MutableBlock(block)
        }
        }
    }

    static hydrateBlocks(blocks: IBlock[]): MutableBlock[] {
        return blocks.map((block) => this.hydrateBlock(block))
    }
}

export {OctoUtils}
