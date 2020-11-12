// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock, MutableBlock} from './blocks/block'
import {Board, IPropertyOption, IPropertyTemplate, MutableBoard, PropertyType} from './blocks/board'
import {BoardView, ISortOption, MutableBoardView} from './blocks/boardView'
import {Card, MutableCard} from './blocks/card'
import {MutableImageBlock} from './blocks/imageBlock'
import {IOrderedBlock, MutableOrderedBlock} from './blocks/orderedBlock'
import {BoardTree} from './viewModel/boardTree'
import {FilterGroup} from './filterGroup'
import octoClient from './octoClient'
import undoManager from './undomanager'
import {Utils} from './utils'
import {OctoUtils} from './octoUtils'

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
class Mutator {
    private undoGroupId?: string

    private beginUndoGroup(): string | undefined {
        if (this.undoGroupId) {
            Utils.assertFailure('UndoManager does not support nested groups')
            return
        }
        this.undoGroupId = Utils.createGuid()
        return this.undoGroupId
    }

    private endUndoGroup(groupId: string) {
        if (this.undoGroupId !== groupId) {
            Utils.assertFailure('Mismatched groupId. UndoManager does not support nested groups')
            return
        }
        this.undoGroupId = undefined
    }

    async performAsUndoGroup(actions: () => Promise<void>): Promise<void> {
        const groupId = this.beginUndoGroup()
        try {
            await actions()
        } catch (err) {
            Utils.assertFailure(`ERROR: ${err?.toString?.()}`)
        }
        if (groupId) {
            this.endUndoGroup(groupId)
        }
    }

    async updateBlock(newBlock: IBlock, oldBlock: IBlock, description: string): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.updateBlock(newBlock)
            },
            async () => {
                await octoClient.updateBlock(oldBlock)
            },
            description,
            this.undoGroupId,
        )
    }

    private async updateBlocks(newBlocks: IBlock[], oldBlocks: IBlock[], description: string): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.updateBlocks(newBlocks)
            },
            async () => {
                await octoClient.updateBlocks(oldBlocks)
            },
            description,
            this.undoGroupId,
        )
    }

    async insertBlock(block: IBlock, description = 'add', afterRedo?: () => Promise<void>, beforeUndo?: () => Promise<void>) {
        await undoManager.perform(
            async () => {
                await octoClient.insertBlock(block)
                await afterRedo?.()
            },
            async () => {
                await beforeUndo?.()
                await octoClient.deleteBlock(block.id)
            },
            description,
            this.undoGroupId,
        )
    }

    async insertBlocks(blocks: IBlock[], description = 'add', afterRedo?: () => Promise<void>, beforeUndo?: () => Promise<void>) {
        await undoManager.perform(
            async () => {
                await octoClient.insertBlocks(blocks)
                await afterRedo?.()
            },
            async () => {
                await beforeUndo?.()
                for (const block of blocks) {
                    await octoClient.deleteBlock(block.id)
                }
            },
            description,
            this.undoGroupId,
        )
    }

    async deleteBlock(block: IBlock, description?: string, beforeRedo?: () => Promise<void>, afterUndo?: () => Promise<void>) {
        if (!description) {
            description = `delete ${block.type}`
        }

        await undoManager.perform(
            async () => {
                await beforeRedo?.()
                await octoClient.deleteBlock(block.id)
            },
            async () => {
                await octoClient.insertBlock(block)
                await afterUndo?.()
            },
            description,
            this.undoGroupId,
        )
    }

    async changeTitle(block: IBlock, title: string, description = 'change title') {
        const newBlock = new MutableBlock(block)
        newBlock.title = title
        await this.updateBlock(newBlock, block, description)
    }

    async changeIcon(block: Card | Board, icon: string, description = 'change icon') {
        let newBlock: IBlock
        switch (block.type) {
        case 'card': {
            const card = new MutableCard(block)
            card.icon = icon
            newBlock = card
            break
        }
        case 'board': {
            const board = new MutableBoard(block)
            board.icon = icon
            newBlock = board
            break
        }
        default: {
            Utils.assertFailure(`changeIcon: Invalid block type: ${block.type}`)
            return
        }
        }

        await this.updateBlock(newBlock, block, description)
    }

    async changeOrder(block: IOrderedBlock, order: number, description = 'change order') {
        const newBlock = new MutableOrderedBlock(block)
        newBlock.order = order
        await this.updateBlock(newBlock, block, description)
    }

    // Property Templates

    async insertPropertyTemplate(boardTree: BoardTree, index = -1, template?: IPropertyTemplate) {
        const {board, activeView} = boardTree
        if (!activeView) {
            Utils.assertFailure('insertPropertyTemplate: no activeView')
            return
        }

        if (index < 0) {
            index = board.cardProperties.length
        }

        if (!template) {
            template = {
                id: Utils.createGuid(),
                name: 'New Property',
                type: 'text',
                options: [],
            }
        }

        const oldBlocks: IBlock[] = [board]

        const newBoard = new MutableBoard(board)
        newBoard.cardProperties.splice(index, 0, template)
        const changedBlocks: IBlock[] = [newBoard]

        let description = 'add property'

        if (activeView.viewType === 'table') {
            oldBlocks.push(activeView)

            const newActiveView = new MutableBoardView(activeView)
            newActiveView.visiblePropertyIds.push(template.id)
            changedBlocks.push(newActiveView)

            description = 'add column'
        }

        await this.updateBlocks(changedBlocks, oldBlocks, description)
    }

    async duplicatePropertyTemplate(boardTree: BoardTree, propertyId: string) {
        const {board, activeView} = boardTree
        if (!activeView) {
            Utils.assertFailure('duplicatePropertyTemplate: no activeView')
            return
        }

        const oldBlocks: IBlock[] = [board]

        const newBoard = new MutableBoard(board)
        const changedBlocks: IBlock[] = [newBoard]
        const index = newBoard.cardProperties.findIndex((o) => o.id === propertyId)
        if (index === -1) {
            Utils.assertFailure(`Cannot find template with id: ${propertyId}`)
            return
        }
        const srcTemplate = newBoard.cardProperties[index]
        const newTemplate: IPropertyTemplate = {
            id: Utils.createGuid(),
            name: `Copy of ${srcTemplate.name}`,
            type: srcTemplate.type,
            options: srcTemplate.options.slice(),
        }
        newBoard.cardProperties.splice(index + 1, 0, newTemplate)

        let description = 'duplicate property'
        if (activeView.viewType === 'table') {
            oldBlocks.push(activeView)

            const newActiveView = new MutableBoardView(activeView)
            newActiveView.visiblePropertyIds.push(newTemplate.id)
            changedBlocks.push(newActiveView)

            description = 'duplicate column'
        }

        await this.updateBlocks(changedBlocks, oldBlocks, description)
    }

    async changePropertyTemplateOrder(board: Board, template: IPropertyTemplate, destIndex: number) {
        const templates = board.cardProperties
        const newValue = templates.slice()

        const srcIndex = templates.indexOf(template)
        Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)
        newValue.splice(destIndex, 0, newValue.splice(srcIndex, 1)[0])

        const newBoard = new MutableBoard(board)
        newBoard.cardProperties = newValue

        await this.updateBlock(newBoard, board, 'reorder properties')
    }

    async deleteProperty(boardTree: BoardTree, propertyId: string) {
        const {board, views, cards} = boardTree

        const oldBlocks: IBlock[] = [board]

        const newBoard = new MutableBoard(board)
        const changedBlocks: IBlock[] = [newBoard]
        newBoard.cardProperties = board.cardProperties.filter((o) => o.id !== propertyId)

        views.forEach((view) => {
            if (view.visiblePropertyIds.includes(propertyId)) {
                oldBlocks.push(view)

                const newView = new MutableBoardView(view)
                newView.visiblePropertyIds = view.visiblePropertyIds.filter((o) => o !== propertyId)
                changedBlocks.push(newView)
            }
        })
        cards.forEach((card) => {
            if (card.properties[propertyId]) {
                oldBlocks.push(card)

                const newCard = new MutableCard(card)
                delete newCard.properties[propertyId]
                changedBlocks.push(newCard)
            }
        })

        await this.updateBlocks(changedBlocks, oldBlocks, 'delete property')
    }

    async renameProperty(board: Board, propertyId: string, name: string) {
        const newBoard = new MutableBoard(board)

        const template = newBoard.cardProperties.find((o) => o.id === propertyId)
        if (!template) {
            Utils.assertFailure(`Can't find property template with Id: ${propertyId}`)
            return
        }
        Utils.log(`renameProperty from ${template.name} to ${name}`)
        template.name = name

        await this.updateBlock(newBoard, board, 'rename property')
    }

    // Properties

    async insertPropertyOption(boardTree: BoardTree, template: IPropertyTemplate, option: IPropertyOption, description = 'add option') {
        const {board} = boardTree

        Utils.assert(board.cardProperties.includes(template))

        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find((o) => o.id === template.id)!
        newTemplate.options.push(option)

        await this.updateBlock(newBoard, board, description)
    }

    async deletePropertyOption(boardTree: BoardTree, template: IPropertyTemplate, option: IPropertyOption) {
        const {board} = boardTree

        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find((o) => o.id === template.id)!
        newTemplate.options = newTemplate.options.filter((o) => o.id !== option.id)

        await this.updateBlock(newBoard, board, 'delete option')
    }

    async changePropertyOptionOrder(board: Board, template: IPropertyTemplate, option: IPropertyOption, destIndex: number) {
        const srcIndex = template.options.indexOf(option)
        Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)

        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find((o) => o.id === template.id)!
        newTemplate.options.splice(destIndex, 0, newTemplate.options.splice(srcIndex, 1)[0])

        await this.updateBlock(newBoard, board, 'reorder options')
    }

    async changePropertyOptionValue(boardTree: BoardTree, propertyTemplate: IPropertyTemplate, option: IPropertyOption, value: string) {
        const {board, cards} = boardTree

        const oldBlocks: IBlock[] = [board]

        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find((o) => o.id === propertyTemplate.id)!
        const newOption = newTemplate.options.find((o) => o.id === option.id)!
        newOption.value = value
        const changedBlocks: IBlock[] = [newBoard]

        await this.updateBlocks(changedBlocks, oldBlocks, 'rename option')

        return changedBlocks
    }

    async changePropertyOptionColor(board: Board, template: IPropertyTemplate, option: IPropertyOption, color: string) {
        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find((o) => o.id === template.id)!
        const newOption = newTemplate.options.find((o) => o.id === option.id)!
        newOption.color = color
        await this.updateBlock(newBoard, board, 'change option color')
    }

    async changePropertyValue(card: Card, propertyId: string, value?: string, description = 'change property') {
        const newCard = new MutableCard(card)
        if (value) {
            newCard.properties[propertyId] = value
        } else {
            delete newCard.properties[propertyId]
        }
        await this.updateBlock(newCard, card, description)
    }

    async changePropertyType(boardTree: BoardTree, propertyTemplate: IPropertyTemplate, type: PropertyType) {
        const {board} = boardTree

        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find((o) => o.id === propertyTemplate.id)!
        newTemplate.type = type

        const oldBlocks: IBlock[] = [board]
        const newBlocks: IBlock[] = [newBoard]
        if (propertyTemplate.type === 'select') {
            // Map select to their values
            for (const card of boardTree.allCards) {
                const oldValue = card.properties[propertyTemplate.id]
                if (oldValue) {
                    const newValue = propertyTemplate.options.find((o) => o.id === oldValue)?.value
                    const newCard = new MutableCard(card)
                    if (newValue) {
                        newCard.properties[propertyTemplate.id] = newValue
                    } else {
                        delete newCard.properties[propertyTemplate.id]
                    }
                    newBlocks.push(newCard)
                    oldBlocks.push(card)
                }
            }
        } else if (type === 'select') {
            // Map values to template option IDs
            for (const card of boardTree.allCards) {
                const oldValue = card.properties[propertyTemplate.id]
                if (oldValue) {
                    const newValue = propertyTemplate.options.find((o) => o.value === oldValue)?.id
                    const newCard = new MutableCard(card)
                    if (newValue) {
                        newCard.properties[propertyTemplate.id] = newValue
                    } else {
                        delete newCard.properties[propertyTemplate.id]
                    }
                    newBlocks.push(newCard)
                    oldBlocks.push(card)
                }
            }
        }

        await this.updateBlocks(newBlocks, oldBlocks, 'change property type')
    }

    // Views

    async changeViewSortOptions(view: BoardView, sortOptions: ISortOption[]): Promise<void> {
        const newView = new MutableBoardView(view)
        newView.sortOptions = sortOptions
        await this.updateBlock(newView, view, 'sort')
    }

    async changeViewFilter(view: BoardView, filter?: FilterGroup): Promise<void> {
        const newView = new MutableBoardView(view)
        newView.filter = filter
        await this.updateBlock(newView, view, 'filter')
    }

    async changeViewGroupById(view: BoardView, groupById: string): Promise<void> {
        const newView = new MutableBoardView(view)
        newView.groupById = groupById
        await this.updateBlock(newView, view, 'group by')
    }

    async changeViewVisibleProperties(view: BoardView, visiblePropertyIds: string[], description = 'show / hide property'): Promise<void> {
        const newView = new MutableBoardView(view)
        newView.visiblePropertyIds = visiblePropertyIds
        await this.updateBlock(newView, view, description)
    }

    async changeViewVisibleOptionIds(view: BoardView, visibleOptionIds: string[], description = 'reorder'): Promise<void> {
        const newView = new MutableBoardView(view)
        newView.visibleOptionIds = visibleOptionIds
        await this.updateBlock(newView, view, description)
    }

    async changeViewHiddenOptionIds(view: BoardView, hiddenOptionIds: string[], description = 'reorder'): Promise<void> {
        const newView = new MutableBoardView(view)
        newView.hiddenOptionIds = hiddenOptionIds
        await this.updateBlock(newView, view, description)
    }

    async hideViewColumn(view: BoardView, columnOptionId: string): Promise<void> {
        if (view.hiddenOptionIds.includes(columnOptionId)) {
            return
        }

        const newView = new MutableBoardView(view)
        newView.visibleOptionIds = newView.visibleOptionIds.filter((o) => o !== columnOptionId)
        newView.hiddenOptionIds.push(columnOptionId)
        await this.updateBlock(newView, view, 'hide column')
    }

    async unhideViewColumn(view: BoardView, columnOptionId: string): Promise<void> {
        if (!view.hiddenOptionIds.includes(columnOptionId)) {
            return
        }

        const newView = new MutableBoardView(view)
        newView.hiddenOptionIds = newView.hiddenOptionIds.filter((o) => o !== columnOptionId)

        // Put the column at the end of the visible list
        newView.visibleOptionIds = newView.visibleOptionIds.filter((o) => o !== columnOptionId)
        newView.visibleOptionIds.push(columnOptionId)
        await this.updateBlock(newView, view, 'show column')
    }

    async changeViewCardOrder(view: BoardView, cardOrder: string[], description = 'reorder'): Promise<void> {
        const newView = new MutableBoardView(view)
        newView.cardOrder = cardOrder
        await this.updateBlock(newView, view, description)
    }

    // Duplicate

    async duplicateCard(cardId: string, description = 'duplicate card', afterRedo?: (newBoardId: string) => Promise<void>, beforeUndo?: () => Promise<void>): Promise<[IBlock[], string]> {
        const blocks = await octoClient.getSubtree(cardId, 2)
        let [newBlocks, idMap] = OctoUtils.duplicateBlockTree(blocks, cardId)
        newBlocks = newBlocks.filter((o) => o.type !== 'comment')
        Utils.log(`duplicateCard: duplicating ${newBlocks.length} blocks`)
        const newCardId = idMap[cardId]
        const newCard = newBlocks.find((o) => o.id === newCardId)!
        newCard.title = `Copy of ${newCard.title}`
        await this.insertBlocks(
            newBlocks,
            description,
            async () => {
                await afterRedo?.(newCardId)
            },
            beforeUndo,
        )
        return [newBlocks, newCardId]
    }

    async duplicateBoard(boardId: string, description = 'duplicate board', afterRedo?: (newBoardId: string) => Promise<void>, beforeUndo?: () => Promise<void>): Promise<[IBlock[], string]> {
        const blocks = await octoClient.getSubtree(boardId, 3)
        let [newBlocks, idMap] = OctoUtils.duplicateBlockTree(blocks, boardId)
        newBlocks = newBlocks.filter((o) => o.type !== 'comment')
        Utils.log(`duplicateBoard: duplicating ${newBlocks.length} blocks`)
        const newBoardId = idMap[boardId]
        const newBoard = newBlocks.find((o) => o.id === newBoardId)!
        newBoard.title = `Copy of ${newBoard.title}`
        await this.insertBlocks(
            newBlocks,
            description,
            async () => {
                await afterRedo?.(newBoardId)
            },
            beforeUndo,
        )
        return [newBlocks, newBoardId]
    }

    // Other methods

    // Not a mutator, but convenient to put here since Mutator wraps OctoClient
    async exportFullArchive(): Promise<IBlock[]> {
        return octoClient.exportFullArchive()
    }

    // Not a mutator, but convenient to put here since Mutator wraps OctoClient
    async importFullArchive(blocks: IBlock[]): Promise<Response> {
        return octoClient.importFullArchive(blocks)
    }

    async createImageBlock(parentId: string, file: File, order = 1000): Promise<IBlock | undefined> {
        const url = await octoClient.uploadFile(file)
        if (!url) {
            return undefined
        }

        const block = new MutableImageBlock()
        block.parentId = parentId
        block.order = order
        block.url = url

        await undoManager.perform(
            async () => {
                await octoClient.insertBlock(block)
            },
            async () => {
                await octoClient.deleteBlock(block.id)
            },
            'add image',
            this.undoGroupId,
        )

        return block
    }

    get canUndo(): boolean {
        return undoManager.canUndo
    }

    get canRedo(): boolean {
        return undoManager.canRedo
    }

    get undoDescription(): string | undefined {
        return undoManager.undoDescription
    }

    get redoDescription(): string | undefined {
        return undoManager.redoDescription
    }

    async undo() {
        await undoManager.undo()
    }

    async redo() {
        await undoManager.redo()
    }
}

const mutator = new Mutator()
export default mutator

export {mutator}
