// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {MutableBlock} from './blocks/block'
import {IPropertyTemplate, MutableBoard} from './blocks/board'
import {ISortOption, MutableBoardView} from './blocks/boardView'
import {Card, MutableCard} from './blocks/card'
import {MutableCommentBlock} from './blocks/commentBlock'
import {MutableImageBlock} from './blocks/imageBlock'
import {IOrderedBlock} from './blocks/orderedBlock'
import {MutableTextBlock} from './blocks/textBlock'
import {BoardTree} from './viewModel/boardTree'
import {Editable} from './components/editable'
import {Menu} from './menu'
import mutator from './mutator'
import {IBlock} from './octoTypes'
import {Utils} from './utils'

class OctoUtils {
    static propertyDisplayValue(block: IBlock, propertyValue: string | undefined, propertyTemplate: IPropertyTemplate) {
        let displayValue: string
        switch (propertyTemplate.type) {
        case 'createdTime':
            displayValue = Utils.displayDateTime(new Date(block.createAt))
            break
        case 'updatedTime':
            displayValue = Utils.displayDateTime(new Date(block.updateAt))
            break
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
            const cardPropertyValue = propertyTemplate.options.find((o) => o.value === propertyValue)
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
                menu.options.push(...propertyTemplate.options.map((o) => ({id: o.value, name: o.value})))
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

    static showSortMenu(e: React.MouseEvent, boardTree: BoardTree) {
        const {activeView} = boardTree
        const {sortOptions} = activeView
        const sortOption = sortOptions.length > 0 ? sortOptions[0] : undefined

        const propertyTemplates = boardTree.board.cardProperties
        Menu.shared.options = propertyTemplates.map((o) => {
            return {
                id: o.id,
                name: o.name,
                icon: (sortOption?.propertyId === o.id) ? sortOption.reversed ? 'sortUp' : 'sortDown' : undefined,
            }
        })
        Menu.shared.onMenuClicked = async (propertyId: string) => {
            let newSortOptions: ISortOption[] = []
            if (sortOption && sortOption.propertyId === propertyId) {
                // Already sorting by name, so reverse it
                newSortOptions = [
                    {propertyId, reversed: !sortOption.reversed},
                ]
            } else {
                newSortOptions = [
                    {propertyId, reversed: false},
                ]
            }

            await mutator.changeViewSortOptions(activeView, newSortOptions)
        }
        Menu.shared.showAtElement(e.target as HTMLElement)
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
