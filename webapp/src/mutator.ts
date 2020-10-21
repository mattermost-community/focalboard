// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {MutableBlock} from './blocks/block'
import {Board, IPropertyOption, IPropertyTemplate, MutableBoard, PropertyType} from './blocks/board'
import {BoardView, ISortOption, MutableBoardView} from './blocks/boardView'
import {Card, MutableCard} from './blocks/card'
import {MutableImageBlock} from './blocks/imageBlock'
import {IOrderedBlock, MutableOrderedBlock} from './blocks/orderedBlock'
import {BoardTree} from './viewModel/boardTree'
import {FilterGroup} from './filterGroup'
import octoClient from './octoClient'
import {IBlock} from './blocks/block'
import undoManager from './undomanager'
import {Utils} from './utils'

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
class Mutator {
    private async updateBlock(newBlock: IBlock, oldBlock: IBlock, description: string): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.updateBlock(newBlock)
            },
            async () => {
                await octoClient.updateBlock(oldBlock)
            },
            description,
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
        )
    }

    async changeTitle(block: IBlock, title: string, description = 'change title') {
        const newBlock = new MutableBlock(block)
        newBlock.title = title
        await this.updateBlock(newBlock, block, description)
    }

    async changeIcon(block: Card | Board, icon: string, description = 'change icon') {
        var newBlock: IBlock
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

    async duplicatePropertyTemplate(boardTree: BoardTree, propertyId: string): Promise<IBlock[]> {
        const {board, activeView} = boardTree

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

        return changedBlocks
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
        const newTemplate = newBoard.cardProperties.find(o => o.id === template.id)
        newTemplate.options.push(option)

        await this.updateBlock(newBoard, board, description)
    }

    async deletePropertyOption(boardTree: BoardTree, template: IPropertyTemplate, option: IPropertyOption) {
        const {board} = boardTree

        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find(o => o.id === template.id)
        newTemplate.options = newTemplate.options.filter(o => o.value !== option.value)

        await this.updateBlock(newBoard, board, 'delete option')
    }

    async changePropertyOptionOrder(board: Board, template: IPropertyTemplate, option: IPropertyOption, destIndex: number) {
        const srcIndex = template.options.indexOf(option)
        Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)

        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find(o => o.id === template.id)
        newTemplate.options.splice(destIndex, 0, newTemplate.options.splice(srcIndex, 1)[0])

        await this.updateBlock(newBoard, board, 'reorder options')
    }

    async changePropertyOptionValue(boardTree: BoardTree, propertyTemplate: IPropertyTemplate, option: IPropertyOption, value: string) {
        const {board, cards} = boardTree

        const oldValue = option.value
        const oldBlocks: IBlock[] = [board]

        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find(o => o.id === propertyTemplate.id)
        const newOption = newTemplate.options.find(o => o.value === oldValue)
        newOption.value = value
        const changedBlocks: IBlock[] = [newBoard]

        // Change the value on all cards that have this property too
        for (const card of cards) {
            const propertyValue = card.properties[propertyTemplate.id]
            if (propertyValue && propertyValue === oldValue) {
                oldBlocks.push(card)

                const newCard = new MutableCard(card)
                newCard.properties[propertyTemplate.id] = value
                changedBlocks.push(newCard)
            }
        }

        await this.updateBlocks(changedBlocks, oldBlocks, 'rename option')

        return changedBlocks
    }

    async changePropertyOptionColor(board: Board, template: IPropertyTemplate, option: IPropertyOption, color: string) {
        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find(o => o.id === template.id)
        const newOption = newTemplate.options.find(o => o.value === option.value)
        newOption.color = color
        await this.updateBlock(newBoard, board, 'change option color')
    }

    async changePropertyValue(card: Card, propertyId: string, value?: string, description = 'change property') {
        const newCard = new MutableCard(card)
        newCard.properties[propertyId] = value
        await this.updateBlock(newCard, card, description)
    }

    async changePropertyType(board: Board, propertyTemplate: IPropertyTemplate, type: PropertyType) {
        const newBoard = new MutableBoard(board)
        const newTemplate = newBoard.cardProperties.find(o => o.id === propertyTemplate.id)
        newTemplate.type = type
        await this.updateBlock(newBoard, board, 'change property type')
    }

    // Views

    async changeViewSortOptions(view: BoardView, sortOptions: ISortOption[]) {
        const newView = new MutableBoardView(view)
        newView.sortOptions = sortOptions
        await this.updateBlock(newView, view, 'sort')
    }

    async changeViewFilter(view: BoardView, filter?: FilterGroup) {
        const newView = new MutableBoardView(view)
        newView.filter = filter
        await this.updateBlock(newView, view, 'filter')
    }

    async changeViewVisibleProperties(view: BoardView, visiblePropertyIds: string[], description: string = 'show / hide property') {
        const newView = new MutableBoardView(view)
        newView.visiblePropertyIds = visiblePropertyIds
        await this.updateBlock(newView, view, description)
    }

    async changeViewGroupById(view: BoardView, groupById: string) {
        const newView = new MutableBoardView(view)
        newView.groupById = groupById
        await this.updateBlock(newView, view, 'group by')
    }

    // Not a mutator, but convenient to put here since Mutator wraps OctoClient
    async exportFullArchive() {
        return octoClient.exportFullArchive()
    }

    // Not a mutator, but convenient to put here since Mutator wraps OctoClient
    async importFullArchive(blocks: IBlock[]) {
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
        )

        return block
    }

    async undo() {
        await undoManager.undo()
    }

    undoDescription(): string | undefined {
        return undoManager.undoDescription
    }

    async redo() {
        await undoManager.redo()
    }

    redoDescription(): string | undefined {
        return undoManager.redoDescription
    }
}

const mutator = new Mutator()
export default mutator

export {mutator}
