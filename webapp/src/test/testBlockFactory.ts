// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Board, IPropertyOption, IPropertyTemplate, createBoard} from '../blocks/board'
import {BoardView, createBoardView} from '../blocks/boardView'
import {Card, createCard} from '../blocks/card'
import {CommentBlock, createCommentBlock} from '../blocks/commentBlock'
import {DividerBlock, createDividerBlock} from '../blocks/dividerBlock'
import {createFilterClause} from '../blocks/filterClause'
import {createFilterGroup} from '../blocks/filterGroup'
import {ImageBlock, createImageBlock} from '../blocks/imageBlock'
import {TextBlock, createTextBlock} from '../blocks/textBlock'

class TestBlockFactory {
    static createBoard(): Board {
        const board = createBoard()
        board.rootId = board.id
        board.title = 'board title'
        board.fields.description = 'description'
        board.fields.showDescription = true
        board.fields.icon = 'i'

        for (let i = 0; i < 3; i++) {
            const propertyOption: IPropertyOption = {
                id: 'value1',
                value: 'value 1',
                color: 'propColorBrown',
            }
            const propertyTemplate: IPropertyTemplate = {
                id: `property${i + 1}`,
                name: `Property ${i + 1}`,
                type: 'select',
                options: [propertyOption],
            }
            board.fields.cardProperties.push(propertyTemplate)
        }

        return board
    }

    static createBoardView(board?: Board): BoardView {
        const view = createBoardView()
        view.parentId = board ? board.id : 'parent'
        view.rootId = board ? board.rootId : 'root'
        view.title = 'view title'
        view.fields.viewType = 'board'
        view.fields.groupById = 'property1'
        view.fields.hiddenOptionIds = ['value1']
        view.fields.cardOrder = ['card1', 'card2', 'card3']
        view.fields.sortOptions = [
            {
                propertyId: 'property1',
                reversed: true,
            },
            {
                propertyId: 'property2',
                reversed: false,
            },
        ]
        view.fields.columnWidths = {
            column1: 100,
            column2: 200,
        }

        // Filter
        const filterGroup = createFilterGroup()
        const filter = createFilterClause()
        filter.propertyId = 'property1'
        filter.condition = 'includes'
        filter.values = ['value1']
        filterGroup.filters.push(filter)
        view.fields.filter = filterGroup

        return view
    }

    static createCard(board?: Board): Card {
        const card = createCard()
        card.parentId = board ? board.id : 'parent'
        card.rootId = board ? board.rootId : 'root'
        card.title = 'title'
        card.fields.icon = 'i'
        card.fields.properties.property1 = 'value1'

        return card
    }

    static createComment(card: Card): CommentBlock {
        const block = createCommentBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'

        return block
    }

    static createText(card: Card): TextBlock {
        const block = createTextBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'

        return block
    }

    static createImage(card: Card): ImageBlock {
        const block = createImageBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.fields.fileId = 'fileId'

        return block
    }

    static createDivider(card: Card): DividerBlock {
        const block = createDividerBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'

        return block
    }
}

export {TestBlockFactory}
