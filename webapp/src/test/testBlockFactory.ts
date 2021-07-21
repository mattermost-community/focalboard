// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Board, IPropertyOption, IPropertyTemplate} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {Card} from '../blocks/card'
import {CommentBlock} from '../blocks/commentBlock'
import {DividerBlock} from '../blocks/dividerBlock'
import {FilterClause} from '../blocks/filterClause'
import {FilterGroup} from '../blocks/filterGroup'
import {ImageBlock} from '../blocks/imageBlock'
import {TextBlock} from '../blocks/textBlock'

class TestBlockFactory {
    static createBoard(): Board {
        const board = new Board()
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
        const view = new BoardView()
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
        const filterGroup = new FilterGroup()
        const filter = new FilterClause()
        filter.propertyId = 'property1'
        filter.condition = 'includes'
        filter.values = ['value1']
        filterGroup.filters.push(filter)
        view.fields.filter = filterGroup

        return view
    }

    static createCard(board?: Board): Card {
        const card = new Card()
        card.parentId = board ? board.id : 'parent'
        card.rootId = board ? board.rootId : 'root'
        card.title = 'title'
        card.fields.icon = 'i'
        card.fields.properties.property1 = 'value1'

        return card
    }

    static createComment(card: Card): CommentBlock {
        const block = new CommentBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'

        return block
    }

    static createText(card: Card): TextBlock {
        const block = new TextBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'

        return block
    }

    static createImage(card: Card): ImageBlock {
        const block = new ImageBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.fields.fileId = 'fileId'

        return block
    }

    static createDivider(card: Card): DividerBlock {
        const block = new DividerBlock()
        block.parentId = card.id
        block.rootId = card.rootId
        block.title = 'title'

        return block
    }
}

export {TestBlockFactory}
