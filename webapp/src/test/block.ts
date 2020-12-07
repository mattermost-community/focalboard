// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {IPropertyOption, IPropertyTemplate, MutableBoard} from '../blocks/board'
import {MutableBoardView} from '../blocks/boardView'
import {Card, MutableCard} from '../blocks/card'
import {MutableCommentBlock} from '../blocks/commentBlock'
import {DividerBlock, MutableDividerBlock} from '../blocks/dividerBlock'
import {ImageBlock, MutableImageBlock} from '../blocks/imageBlock'
import {MutableTextBlock, TextBlock} from '../blocks/textBlock'
import {FilterClause} from '../filterClause'
import {FilterGroup} from '../filterGroup'
import {Utils} from '../utils'

class TestBlockFactory {
    static createBoard(): MutableBoard {
        const board = new MutableBoard()
        board.parentId = 'parent'
        board.rootId = 'root'
        board.title = 'title'
        board.description = 'description'
        board.showDescription = true
        board.icon = 'i'

        for (let i = 0; i < 5; i++) {
            const propertyOption: IPropertyOption = {
                id: 'property1',
                value: 'value1',
                color: 'color1',
            }
            const propertyTemplate: IPropertyTemplate = {
                id: Utils.createGuid(),
                name: 'Status',
                type: 'select',
                options: [propertyOption],
            }
            board.cardProperties.push(propertyTemplate)
        }

        return board
    }

    static createBoardView(): MutableBoardView {
        const view = new MutableBoardView()
        view.parentId = 'parent'
        view.rootId = 'root'
        view.title = 'title'
        view.viewType = 'board'
        view.groupById = 'groupId'
        view.hiddenOptionIds = ['option1', 'option2', 'option3']
        view.cardOrder = ['card1', 'card2', 'card3']
        view.sortOptions = [
            {
                propertyId: 'property1',
                reversed: true,
            },
            {
                propertyId: 'property2',
                reversed: false,
            },
        ]
        view.columnWidths = {
            column1: 100,
            column2: 200,
        }

        // Filter
        const filterGroup = new FilterGroup()
        const filter = new FilterClause()
        filter.propertyId = 'property1'
        filter.condition = 'includes'
        filter.values = ['value1']
        filterGroup.filters.push(filter)
        view.filter = filterGroup

        return view
    }

    static createCard(): MutableCard {
        const card = new MutableCard()
        card.parentId = 'parent'
        card.rootId = 'root'
        card.title = 'title'
        card.icon = 'i'
        card.properties.property1 = 'value1'

        return card
    }

    static createComment(card: Card): MutableCommentBlock {
        const block = new MutableCommentBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'

        return block
    }

    static createText(card: Card): TextBlock {
        const block = new MutableTextBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'
        block.order = 100

        return block
    }

    static createImage(card: Card): ImageBlock {
        const block = new MutableImageBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.url = 'url'
        block.order = 100

        return block
    }

    static createDivider(card: Card): DividerBlock {
        const block = new MutableDividerBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'
        block.order = 100

        return block
    }
}

export {TestBlockFactory}
