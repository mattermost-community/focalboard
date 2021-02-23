// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Board, IPropertyOption, IPropertyTemplate, MutableBoard} from '../blocks/board'
import {MutableBoardView} from '../blocks/boardView'
import {Card, MutableCard} from '../blocks/card'
import {MutableCommentBlock} from '../blocks/commentBlock'
import {DividerBlock, MutableDividerBlock} from '../blocks/dividerBlock'
import {FilterClause} from '../blocks/filterClause'
import {FilterGroup} from '../blocks/filterGroup'
import {ImageBlock, MutableImageBlock} from '../blocks/imageBlock'
import {MutableTextBlock, TextBlock} from '../blocks/textBlock'

class TestBlockFactory {
    static createBoard(): MutableBoard {
        const board = new MutableBoard()
        board.rootId = board.id
        board.title = 'board title'
        board.description = 'description'
        board.showDescription = true
        board.icon = 'i'

        for (let i = 0; i < 3; i++) {
            const propertyOption: IPropertyOption = {
                id: 'value1',
                value: 'value 1',
                color: 'color1',
            }
            const propertyTemplate: IPropertyTemplate = {
                id: `property${i + 1}`,
                name: `Property ${i + 1}`,
                type: 'select',
                options: [propertyOption],
            }
            board.cardProperties.push(propertyTemplate)
        }

        return board
    }

    static createBoardView(board?: Board): MutableBoardView {
        const view = new MutableBoardView()
        view.parentId = board ? board.id : 'parent'
        view.rootId = board ? board.rootId : 'root'
        view.title = 'view title'
        view.viewType = 'board'
        view.groupById = 'property1'
        view.hiddenOptionIds = ['value1']
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

    static createCard(board?: Board): MutableCard {
        const card = new MutableCard()
        card.parentId = board ? board.id : 'parent'
        card.rootId = board ? board.rootId : 'root'
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

        return block
    }

    static createImage(card: Card): ImageBlock {
        const block = new MutableImageBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.fileId = 'fileId'

        return block
    }

    static createDivider(card: Card): DividerBlock {
        const block = new MutableDividerBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'

        return block
    }
}

export {TestBlockFactory}
