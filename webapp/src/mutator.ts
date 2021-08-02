// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {BlockIcons} from './blockIcons'
import {Block, createBlock} from './blocks/block'
import {Board, IPropertyOption, IPropertyTemplate, PropertyType, createBoard} from './blocks/board'
import {BoardView, ISortOption, createBoardView} from './blocks/boardView'
import {Card, createCard} from './blocks/card'
import {FilterGroup} from './blocks/filterGroup'
import octoClient, {OctoClient} from './octoClient'
import {OctoUtils} from './octoUtils'
import undoManager from './undomanager'
import {Utils} from './utils'

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
class Mutator {
    private undoGroupId?: string

    private beginUndoGroup(): string | undefined {
        if (this.undoGroupId) {
            Utils.assertFailure('UndoManager does not support nested groups')
            return undefined
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

    async updateBlock(newBlock: Block, oldBlock: Block, description: string): Promise<void> {
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

    private async updateBlocks(newBlocks: Block[], oldBlocks: Block[], description: string): Promise<void> {
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

    async insertBlock(block: Block, description = 'add', afterRedo?: () => Promise<void>, beforeUndo?: () => Promise<void>) {
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

    async insertBlocks(blocks: Block[], description = 'add', afterRedo?: () => Promise<void>, beforeUndo?: () => Promise<void>) {
        await undoManager.perform(
            async () => {
                await octoClient.insertBlocks(blocks)
                await afterRedo?.()
            },
            async () => {
                await beforeUndo?.()
                const awaits = []
                for (const block of blocks) {
                    awaits.push(octoClient.deleteBlock(block.id))
                }
                await Promise.all(awaits)
            },
            description,
            this.undoGroupId,
        )
    }

    async deleteBlock(block: Block, description?: string, beforeRedo?: () => Promise<void>, afterUndo?: () => Promise<void>) {
        const actualDescription = description || `delete ${block.type}`

        await undoManager.perform(
            async () => {
                await beforeRedo?.()
                await octoClient.deleteBlock(block.id)
            },
            async () => {
                await octoClient.insertBlock(block)
                await afterUndo?.()
            },
            actualDescription,
            this.undoGroupId,
        )
    }

    async changeTitle(block: Block, title: string, description = 'change title') {
        const newBlock = createBlock(block)
        newBlock.title = title
        await this.updateBlock(newBlock, block, description)
    }

    async changeIcon(block: Card | Board, icon: string, description = 'change icon') {
        let newBlock: Block
        switch (block.type) {
        case 'card': {
            const card = createCard(block)
            card.fields.icon = icon
            newBlock = card
            break
        }
        case 'board': {
            const board = createBoard(block)

            board.fields.icon = icon
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

    async changeDescription(block: Block, boardDescription: string, description = 'change description') {
        const newBoard = createBoard(block)
        newBoard.fields.description = boardDescription
        await this.updateBlock(newBoard, block, description)
    }

    async showDescription(board: Board, showDescription = true, description?: string) {
        const newBoard = createBoard(board)
        newBoard.fields.showDescription = showDescription
        let actionDescription = description
        if (!actionDescription) {
            actionDescription = showDescription ? 'show description' : 'hide description'
        }
        await this.updateBlock(newBoard, board, actionDescription)
    }

    async changeCardContentOrder(card: Card, contentOrder: Array<string | string[]>, description = 'reorder'): Promise<void> {
        const newCard = createCard(card)
        newCard.fields.contentOrder = contentOrder
        await this.updateBlock(newCard, card, description)
    }

    // Property Templates

    async insertPropertyTemplate(board: Board, activeView: BoardView, index = -1, template?: IPropertyTemplate) {
        if (!activeView) {
            Utils.assertFailure('insertPropertyTemplate: no activeView')
            return
        }

        const newTemplate = template || {
            id: Utils.createGuid(),
            name: 'New Property',
            type: 'text',
            options: [],
        }

        const oldBlocks: Block[] = [board]

        const newBoard = createBoard(board)
        const startIndex = (index >= 0) ? index : board.fields.cardProperties.length
        newBoard.fields.cardProperties.splice(startIndex, 0, newTemplate)
        const changedBlocks: Block[] = [newBoard]

        let description = 'add property'

        if (activeView.fields.viewType === 'table') {
            oldBlocks.push(activeView)

            const newActiveView = createBoardView(activeView)
            newActiveView.fields.visiblePropertyIds.push(newTemplate.id)
            changedBlocks.push(newActiveView)

            description = 'add column'
        }

        await this.updateBlocks(changedBlocks, oldBlocks, description)
    }

    async duplicatePropertyTemplate(board: Board, activeView: BoardView, propertyId: string) {
        if (!activeView) {
            Utils.assertFailure('duplicatePropertyTemplate: no activeView')
            return
        }

        const oldBlocks: Block[] = [board]

        const newBoard = createBoard(board)
        const changedBlocks: Block[] = [newBoard]
        const index = newBoard.fields.cardProperties.findIndex((o: IPropertyTemplate) => o.id === propertyId)
        if (index === -1) {
            Utils.assertFailure(`Cannot find template with id: ${propertyId}`)
            return
        }
        const srcTemplate = newBoard.fields.cardProperties[index]
        const newTemplate: IPropertyTemplate = {
            id: Utils.createGuid(),
            name: `${srcTemplate.name} copy`,
            type: srcTemplate.type,
            options: srcTemplate.options.slice(),
        }
        newBoard.fields.cardProperties.splice(index + 1, 0, newTemplate)

        let description = 'duplicate property'
        if (activeView.fields.viewType === 'table') {
            oldBlocks.push(activeView)

            const newActiveView = createBoardView(activeView)
            newActiveView.fields.visiblePropertyIds.push(newTemplate.id)
            changedBlocks.push(newActiveView)

            description = 'duplicate column'
        }

        await this.updateBlocks(changedBlocks, oldBlocks, description)
    }

    async changePropertyTemplateOrder(board: Board, template: IPropertyTemplate, destIndex: number) {
        const templates = board.fields.cardProperties
        const newValue = templates.slice()

        const srcIndex = templates.indexOf(template)
        Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)
        newValue.splice(destIndex, 0, newValue.splice(srcIndex, 1)[0])

        const newBoard = createBoard(board)
        newBoard.fields.cardProperties = newValue

        await this.updateBlock(newBoard, board, 'reorder properties')
    }

    async deleteProperty(board: Board, views: BoardView[], cards: Card[], propertyId: string) {
        const oldBlocks: Block[] = [board]

        const newBoard = createBoard(board)
        const changedBlocks: Block[] = [newBoard]
        newBoard.fields.cardProperties = board.fields.cardProperties.filter((o: IPropertyTemplate) => o.id !== propertyId)

        views.forEach((view) => {
            if (view.fields.visiblePropertyIds.includes(propertyId)) {
                oldBlocks.push(view)

                const newView = createBoardView(view)
                newView.fields.visiblePropertyIds = view.fields.visiblePropertyIds.filter((o: string) => o !== propertyId)
                changedBlocks.push(newView)
            }
        })
        cards.forEach((card) => {
            if (card.fields.properties[propertyId]) {
                oldBlocks.push(card)

                const newCard = createCard(card)
                delete newCard.fields.properties[propertyId]
                changedBlocks.push(newCard)
            }
        })

        await this.updateBlocks(changedBlocks, oldBlocks, 'delete property')
    }

    // Properties

    async insertPropertyOption(board: Board, template: IPropertyTemplate, option: IPropertyOption, description = 'add option') {
        Utils.assert(board.fields.cardProperties.includes(template))

        const newBoard = createBoard(board)
        const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!
        newTemplate.options.push(option)

        await this.updateBlock(newBoard, board, description)
    }

    async deletePropertyOption(board: Board, template: IPropertyTemplate, option: IPropertyOption) {
        const newBoard = createBoard(board)
        const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!
        newTemplate.options = newTemplate.options.filter((o) => o.id !== option.id)

        await this.updateBlock(newBoard, board, 'delete option')
    }

    async changePropertyOptionOrder(board: Board, template: IPropertyTemplate, option: IPropertyOption, destIndex: number) {
        const srcIndex = template.options.indexOf(option)
        Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)

        const newBoard = createBoard(board)
        const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!
        newTemplate.options.splice(destIndex, 0, newTemplate.options.splice(srcIndex, 1)[0])

        await this.updateBlock(newBoard, board, 'reorder options')
    }

    async changePropertyOptionValue(board: Board, propertyTemplate: IPropertyTemplate, option: IPropertyOption, value: string) {
        const oldBlocks: Block[] = [board]

        const newBoard = createBoard(board)
        const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === propertyTemplate.id)!
        const newOption = newTemplate.options.find((o) => o.id === option.id)!
        newOption.value = value
        const changedBlocks: Block[] = [newBoard]

        await this.updateBlocks(changedBlocks, oldBlocks, 'rename option')

        return changedBlocks
    }

    async changePropertyOptionColor(board: Board, template: IPropertyTemplate, option: IPropertyOption, color: string) {
        const newBoard = createBoard(board)
        const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!
        const newOption = newTemplate.options.find((o) => o.id === option.id)!
        newOption.color = color
        await this.updateBlock(newBoard, board, 'change option color')
    }

    async changePropertyValue(card: Card, propertyId: string, value?: string | string[], description = 'change property') {
        const newCard = createCard(card)
        if (value) {
            newCard.fields.properties[propertyId] = value
        } else {
            delete newCard.fields.properties[propertyId]
        }
        await this.updateBlock(newCard, card, description)
    }

    async changePropertyTypeAndName(board: Board, cards: Card[], propertyTemplate: IPropertyTemplate, newType: PropertyType, newName: string) {
        if (propertyTemplate.type === newType && propertyTemplate.name === newName) {
            return
        }

        const newBoard = createBoard(board)
        const newTemplate = newBoard.fields.cardProperties.find((o: IPropertyTemplate) => o.id === propertyTemplate.id)!

        if (propertyTemplate.type !== newType) {
            newTemplate.options = []
        }

        newTemplate.type = newType
        newTemplate.name = newName

        const oldBlocks: Block[] = [board]
        const newBlocks: Block[] = [newBoard]

        if (propertyTemplate.type !== newType) {
            if (propertyTemplate.type === 'select' || propertyTemplate.type === 'multiSelect') { // If the old type was either select or multiselect
                const isNewTypeSelectOrMulti = newType === 'select' || newType === 'multiSelect'

                for (const card of cards) {
                    const oldValue = Array.isArray(card.fields.properties[propertyTemplate.id]) ? (card.fields.properties[propertyTemplate.id].length > 0 && card.fields.properties[propertyTemplate.id][0]) : card.fields.properties[propertyTemplate.id]
                    if (oldValue) {
                        const newValue = isNewTypeSelectOrMulti ? propertyTemplate.options.find((o) => o.id === oldValue)?.id : propertyTemplate.options.find((o) => o.id === oldValue)?.value
                        const newCard = createCard(card)

                        if (newValue) {
                            newCard.fields.properties[propertyTemplate.id] = newType === 'multiSelect' ? [newValue] : newValue
                        } else {
                            // This was an invalid select option, so delete it
                            delete newCard.fields.properties[propertyTemplate.id]
                        }

                        newBlocks.push(newCard)
                        oldBlocks.push(card)
                    }

                    if (isNewTypeSelectOrMulti) {
                        newTemplate.options = propertyTemplate.options
                    }
                }
            } else if (newType === 'select' || newType === 'multiSelect') { // if the new type is either select or multiselect
                // Map values to new template option IDs
                for (const card of cards) {
                    const oldValue = card.fields.properties[propertyTemplate.id] as string
                    if (oldValue) {
                        let option = newTemplate.options.find((o: IPropertyOption) => o.value === oldValue)
                        if (!option) {
                            option = {
                                id: Utils.createGuid(),
                                value: oldValue,
                                color: 'propColorDefault',
                            }
                            newTemplate.options.push(option)
                        }

                        const newCard = createCard(card)
                        newCard.fields.properties[propertyTemplate.id] = newType === 'multiSelect' ? [option.id] : option.id

                        newBlocks.push(newCard)
                        oldBlocks.push(card)
                    }
                }
            }
        }

        await this.updateBlocks(newBlocks, oldBlocks, 'change property type and name')
    }

    // Views

    async changeViewSortOptions(view: BoardView, sortOptions: ISortOption[]): Promise<void> {
        const newView = createBoardView(view)
        newView.fields.sortOptions = sortOptions
        await this.updateBlock(newView, view, 'sort')
    }

    async changeViewFilter(view: BoardView, filter: FilterGroup): Promise<void> {
        const newView = createBoardView(view)
        newView.fields.filter = filter
        await this.updateBlock(newView, view, 'filter')
    }

    async changeViewGroupById(view: BoardView, groupById: string): Promise<void> {
        const newView = createBoardView(view)
        newView.fields.groupById = groupById
        newView.fields.hiddenOptionIds = []
        newView.fields.visibleOptionIds = []
        await this.updateBlock(newView, view, 'group by')
    }

    async changeViewVisibleProperties(view: BoardView, visiblePropertyIds: string[], description = 'show / hide property'): Promise<void> {
        const newView = createBoardView(view)
        newView.fields.visiblePropertyIds = visiblePropertyIds
        await this.updateBlock(newView, view, description)
    }

    async changeViewVisibleOptionIds(view: BoardView, visibleOptionIds: string[], description = 'reorder'): Promise<void> {
        const newView = createBoardView(view)
        newView.fields.visibleOptionIds = visibleOptionIds
        await this.updateBlock(newView, view, description)
    }

    async changeViewHiddenOptionIds(view: BoardView, hiddenOptionIds: string[], description = 'reorder'): Promise<void> {
        const newView = createBoardView(view)
        newView.fields.hiddenOptionIds = hiddenOptionIds
        await this.updateBlock(newView, view, description)
    }

    async hideViewColumn(view: BoardView, columnOptionId: string): Promise<void> {
        if (view.fields.hiddenOptionIds.includes(columnOptionId)) {
            return
        }

        const newView = createBoardView(view)
        newView.fields.visibleOptionIds = newView.fields.visibleOptionIds.filter((o) => o !== columnOptionId)
        newView.fields.hiddenOptionIds = [...newView.fields.hiddenOptionIds, columnOptionId]
        await this.updateBlock(newView, view, 'hide column')
    }

    async unhideViewColumn(view: BoardView, columnOptionId: string): Promise<void> {
        if (!view.fields.hiddenOptionIds.includes(columnOptionId)) {
            return
        }

        const newView = createBoardView(view)
        newView.fields.hiddenOptionIds = newView.fields.hiddenOptionIds.filter((o) => o !== columnOptionId)

        // Put the column at the end of the visible list
        newView.fields.visibleOptionIds = newView.fields.visibleOptionIds.filter((o) => o !== columnOptionId)
        newView.fields.visibleOptionIds = [...newView.fields.visibleOptionIds, columnOptionId]
        await this.updateBlock(newView, view, 'show column')
    }

    async changeViewCardOrder(view: BoardView, cardOrder: string[], description = 'reorder'): Promise<void> {
        const newView = createBoardView(view)
        newView.fields.cardOrder = cardOrder
        await this.updateBlock(newView, view, description)
    }

    // Duplicate

    async duplicateCard(
        cardId: string,
        description = 'duplicate card',
        asTemplate = false,
        afterRedo?: (newCardId: string) => Promise<void>,
        beforeUndo?: () => Promise<void>,
    ): Promise<[Block[], string]> {
        const blocks = await octoClient.getSubtree(cardId, 2)
        const [newBlocks1, newCard] = OctoUtils.duplicateBlockTree(blocks, cardId) as [Block[], Card, Record<string, string>]
        const newBlocks = newBlocks1.filter((o) => o.type !== 'comment')
        Utils.log(`duplicateCard: duplicating ${newBlocks.length} blocks`)
        if (asTemplate === newCard.fields.isTemplate) {
            // Copy template
            newCard.title = `${newCard.title} copy`
        } else if (asTemplate) {
            // Template from card
            newCard.title = 'New card template'
        } else {
            // Card from template
            newCard.title = ''

            // If the template doesn't specify an icon, initialize it to a random one
            if (!newCard.fields.icon) {
                newCard.fields.icon = BlockIcons.shared.randomIcon()
            }
        }
        newCard.fields.isTemplate = asTemplate
        await this.insertBlocks(
            newBlocks,
            description,
            async () => {
                await afterRedo?.(newCard.id)
            },
            beforeUndo,
        )
        return [newBlocks, newCard.id]
    }

    async duplicateBoard(
        boardId: string,
        description = 'duplicate board',
        asTemplate = false,
        afterRedo?: (newBoardId: string) => Promise<void>,
        beforeUndo?: () => Promise<void>,
    ): Promise<[Block[], string]> {
        const blocks = await octoClient.getSubtree(boardId, 3)
        const [newBlocks1, newBoard] = OctoUtils.duplicateBlockTree(blocks, boardId) as [Block[], Board, Record<string, string>]
        const newBlocks = newBlocks1.filter((o) => o.type !== 'comment')
        Utils.log(`duplicateBoard: duplicating ${newBlocks.length} blocks`)

        if (asTemplate === newBoard.fields.isTemplate) {
            newBoard.title = `${newBoard.title} copy`
        } else if (asTemplate) {
            // Template from board
            newBoard.title = 'New board template'
        } else {
            // Board from template
        }
        newBoard.fields.isTemplate = asTemplate
        await this.insertBlocks(
            newBlocks,
            description,
            async () => {
                await afterRedo?.(newBoard.id)
            },
            beforeUndo,
        )
        return [newBlocks, newBoard.id]
    }

    async duplicateFromRootBoard(
        boardId: string,
        description = 'duplicate board',
        asTemplate = false,
        afterRedo?: (newBoardId: string) => Promise<void>,
        beforeUndo?: () => Promise<void>,
    ): Promise<[Block[], string]> {
        const rootClient = new OctoClient(octoClient.serverUrl, '0')
        const blocks = await rootClient.getSubtree(boardId, 3)
        const [newBlocks1, newBoard] = OctoUtils.duplicateBlockTree(blocks, boardId) as [Block[], Board, Record<string, string>]
        const newBlocks = newBlocks1.filter((o) => o.type !== 'comment')
        Utils.log(`duplicateBoard: duplicating ${newBlocks.length} blocks`)

        if (asTemplate === newBoard.fields.isTemplate) {
            newBoard.title = `${newBoard.title} copy`
        } else if (asTemplate) {
            // Template from board
            newBoard.title = 'New board template'
        } else {
            // Board from template
        }
        newBoard.fields.isTemplate = asTemplate
        await this.insertBlocks(
            newBlocks,
            description,
            async () => {
                await afterRedo?.(newBoard.id)
            },
            beforeUndo,
        )
        return [newBlocks, newBoard.id]
    }

    // Other methods

    // Not a mutator, but convenient to put here since Mutator wraps OctoClient
    async exportArchive(boardID?: string): Promise<Block[]> {
        return octoClient.exportArchive(boardID)
    }

    // Not a mutator, but convenient to put here since Mutator wraps OctoClient
    async importFullArchive(blocks: readonly Block[]): Promise<Response> {
        return octoClient.importFullArchive(blocks)
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
