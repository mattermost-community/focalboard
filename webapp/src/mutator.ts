// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {BlockIcons} from './blockIcons'
import {Block, BlockPatch, createPatchesFromBlocks} from './blocks/block'
import {Board, IPropertyOption, IPropertyTemplate, PropertyType, createBoard} from './blocks/board'
import {BoardView, ISortOption, createBoardView, KanbanCalculationFields} from './blocks/boardView'
import {Card, createCard} from './blocks/card'
import {FilterGroup} from './blocks/filterGroup'
import octoClient, {OctoClient} from './octoClient'
import {OctoUtils} from './octoUtils'
import undoManager from './undomanager'
import {Utils, IDType} from './utils'
import {UserSettings} from './userSettings'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from './telemetry/telemetryClient'
import {Category} from './store/sidebar'

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
class Mutator {
    private undoGroupId?: string
    private undoDisplayId?: string

    private beginUndoGroup(): string | undefined {
        if (this.undoGroupId) {
            Utils.assertFailure('UndoManager does not support nested groups')
            return undefined
        }
        this.undoGroupId = Utils.createGuid(IDType.None)
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
            Utils.assertFailure(`ERROR: ${err}`)
        }
        if (groupId) {
            this.endUndoGroup(groupId)
        }
    }

    async updateBlock(boardId: string, newBlock: Block, oldBlock: Block, description: string): Promise<void> {
        const [updatePatch, undoPatch] = createPatchesFromBlocks(newBlock, oldBlock)
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, newBlock.id, updatePatch)
            },
            async () => {
                await octoClient.patchBlock(boardId, oldBlock.id, undoPatch)
            },
            description,
            this.undoGroupId,
        )
    }

    private async updateBlocks(boardId: string, newBlocks: Block[], oldBlocks: Block[], description: string): Promise<void> {
        if (newBlocks.length !== oldBlocks.length) {
            throw new Error('new and old blocks must have the same length when updating blocks')
        }

        const updatePatches = [] as BlockPatch[]
        const undoPatches = [] as BlockPatch[]

        newBlocks.forEach((newBlock, i) => {
            const [updatePatch, undoPatch] = createPatchesFromBlocks(newBlock, oldBlocks[i])
            updatePatches.push(updatePatch)
            undoPatches.push(undoPatch)
        })

        return undoManager.perform(
            async () => {
                await Promise.all(
                    updatePatches.map((patch, i) => octoClient.patchBlock(boardId, newBlocks[i].id, patch)),
                )
            },
            async () => {
                await Promise.all(
                    undoPatches.map((patch, i) => octoClient.patchBlock(boardId, newBlocks[i].id, patch)),
                )
            },
            description,
            this.undoGroupId,
        )
    }

    //eslint-disable-next-line no-shadow
    async insertBlock(boardId: string, block: Block, description = 'add', afterRedo?: (block: Block) => Promise<void>, beforeUndo?: (block: Block) => Promise<void>): Promise<Block> {
        return undoManager.perform(
            async () => {
                const res = await octoClient.insertBlock(boardId, block)
                const jsonres = await res.json()
                const newBlock = jsonres[0] as Block
                await afterRedo?.(newBlock)
                return newBlock
            },
            async (newBlock: Block) => {
                await beforeUndo?.(newBlock)
                await octoClient.deleteBlock(boardId, newBlock.id)
            },
            description,
            this.undoGroupId,
        )
    }

    //eslint-disable-next-line no-shadow
    async insertBlocks(boardId: string, blocks: Block[], description = 'add', afterRedo?: (blocks: Block[]) => Promise<void>, beforeUndo?: () => Promise<void>) {
        return undoManager.perform(
            async () => {
                const res = await octoClient.insertBlocks(boardId, blocks)
                const newBlocks = (await res.json()) as Block[]
                await afterRedo?.(newBlocks)
                return newBlocks
            },
            async (newBlocks: Block[]) => {
                await beforeUndo?.()
                const awaits = []
                for (const block of newBlocks) {
                    awaits.push(octoClient.deleteBlock(boardId, block.id))
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
                await octoClient.deleteBlock(block.boardId, block.id)
            },
            async () => {
                await octoClient.insertBlock(block.boardId, block)
                await afterUndo?.()
            },
            actualDescription,
            this.undoGroupId,
        )
    }

    async insertBoard(board: Board, description = 'add', afterRedo?: (board: Board) => Promise<void>, beforeUndo?: (board: Board) => Promise<void>): Promise<Board> {
        // ToDo: implement
        // return undoManager.perform(
        //     async () => {
        //         const res = await octoClient.insertBlock(block)
        //         const jsonres = await res.json()
        //         const newBlock = jsonres[0] as Block
        //         await afterRedo?.(newBlock)
        //         return newBlock
        //     },
    //     async (newBlock: Block) => {
        //         await beforeUndo?.(newBlock)
        //         await octoClient.deleteBlock(newBlock.id)
        //     },
    //     description,
    //     this.undoGroupId,
    // )
        return createBoard()
    }

    async updateBoard(boardId: string, newBoard: Board, oldBoard: Board, description: string): Promise<void> {
        // ToDo: implement

        // const [updatePatch, undoPatch] = createPatchesFromBlocks(newBlock, oldBlock)
        // await undoManager.perform(
        //     async () => {
        //         await octoClient.patchBlock(boardId, newBlock.id, updatePatch)
        //     },
    //     async () => {
        //         await octoClient.patchBlock(boardId, oldBlock.id, undoPatch)
        //     },
    //     description,
    //     this.undoGroupId,
    // )
    }

    async deleteBoard(board: Board, description?: string, beforeRedo?: () => Promise<void>, afterUndo?: () => Promise<void>) {
        // ToDo: implement
    }

    async changeBlockTitle(boardId: string, blockId: string, oldTitle: string, newTitle: string, description = 'change block title') {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, blockId, {title: newTitle})
            },
            async () => {
                await octoClient.patchBlock(boardId, blockId, {title: oldTitle})
            },
            description,
            this.undoGroupId,
        )
    }

    async changeBoardTitle(boardId: string, oldTitle: string, newTitle: string, description = 'change board title') {
        await undoManager.perform(
            async () => {
                await octoClient.patchBoard(boardId, {title: newTitle})
            },
            async () => {
                await octoClient.patchBoard(boardId, {title: oldTitle})
            },
            description,
            this.undoGroupId,
        )
    }

    async setDefaultTemplate(boardId: string, blockId: string, oldTemplateId: string, templateId: string, description = 'set default template') {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, blockId, {updatedFields: {defaultTemplateId: templateId}})
            },
            async () => {
                await octoClient.patchBlock(boardId, blockId, {updatedFields: {defaultTemplateId: oldTemplateId}})
            },
            description,
            this.undoGroupId,
        )
    }

    async clearDefaultTemplate(boardId: string, blockId: string, oldTemplateId: string, description = 'set default template') {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, blockId, {updatedFields: {defaultTemplateId: ''}})
            },
            async () => {
                await octoClient.patchBlock(boardId, blockId, {updatedFields: {defaultTemplateId: oldTemplateId}})
            },
            description,
            this.undoGroupId,
        )
    }

    async changeBoardIcon(boardId: string, oldIcon: string|undefined, icon: string, description = 'change board icon') {
        await undoManager.perform(
            async () => {
                await octoClient.patchBoard(boardId, {icon})
            },
            async () => {
                await octoClient.patchBoard(boardId, {icon: oldIcon})
            },
            description,
            this.undoGroupId,
        )
    }

    async changeBlockIcon(boardId: string, blockId: string, oldIcon: string|undefined, icon: string, description = 'change block icon') {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, blockId, {updatedFields: {icon}})
            },
            async () => {
                await octoClient.patchBlock(boardId, blockId, {updatedFields: {icon: oldIcon}})
            },
            description,
            this.undoGroupId,
        )
    }

    async changeBoardDescription(boardId: string, blockId: string, oldBlockDescription: string|undefined, blockDescription: string, description = 'change description') {
        await undoManager.perform(
            async () => {
                await octoClient.patchBoard(boardId, {description: blockDescription})
            },
            async () => {
                await octoClient.patchBoard(boardId, {description: oldBlockDescription})
            },
            description,
            this.undoGroupId,
        )
    }

    async showBoardDescription(boardId: string, oldShowDescription: boolean, showDescription = true, description?: string) {
        let actionDescription = description
        if (!actionDescription) {
            actionDescription = showDescription ? 'show description' : 'hide description'
        }

        await undoManager.perform(
            async () => {
                await octoClient.patchBoard(boardId, {showDescription})
            },
            async () => {
                await octoClient.patchBoard(boardId, {showDescription: oldShowDescription})
            },
            actionDescription,
            this.undoGroupId,
        )
    }

    async changeCardContentOrder(boardId: string, cardId: string, oldContentOrder: Array<string | string[]>, contentOrder: Array<string | string[]>, description = 'reorder'): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, cardId, {updatedFields: {contentOrder}})
            },
            async () => {
                await octoClient.patchBlock(boardId, cardId, {updatedFields: {contentOrder: oldContentOrder}})
            },
            description,
            this.undoGroupId,
        )
    }

    // Property Templates

    async insertPropertyTemplate(board: Board, activeView: BoardView, index = -1, template?: IPropertyTemplate): Promise<string> {
        if (!activeView) {
            Utils.assertFailure('insertPropertyTemplate: no activeView')
            return ''
        }

        // const newTemplate = template || {
        //     id: Utils.createGuid(IDType.BlockID),
        //     name: 'New Property',
        //     type: 'text',
        //     options: [],
        // }
        //
        // const oldBlocks: Block[] = [board]
        //
        // const newBoard = createBoard(board)
        // const startIndex = (index >= 0) ? index : board.cardProperties.length
        // newBoard.cardProperties.splice(startIndex, 0, newTemplate)
        // const changedBlocks: Block[] = [newBoard]
        //
        // let description = 'add property'
        //
        // if (activeView.fields.viewType === 'table') {
        //     oldBlocks.push(activeView)
        //
        //     const newActiveView = createBoardView(activeView)
        //     newActiveView.fields.visiblePropertyIds.push(newTemplate.id)
        //     changedBlocks.push(newActiveView)
        //
        //     description = 'add column'
        // }
        //
        // await this.updateBlocks(changedBlocks, oldBlocks, description)
        // return newTemplate.id

        // ToDo: needs to update board and view
        return ''
    }

    async duplicatePropertyTemplate(board: Board, activeView: BoardView, propertyId: string) {
        if (!activeView) {
            Utils.assertFailure('duplicatePropertyTemplate: no activeView')
        }

        // const oldBlocks: Block[] = [board]
        //
        // const newBoard = createBoard(board)
        // const changedBlocks: Block[] = [newBoard]
        // const index = newBoard.cardProperties.findIndex((o: IPropertyTemplate) => o.id === propertyId)
        // if (index === -1) {
        //     Utils.assertFailure(`Cannot find template with id: ${propertyId}`)
        //     return
        // }
        // const srcTemplate = newBoard.cardProperties[index]
        // const newTemplate: IPropertyTemplate = {
        //     id: Utils.createGuid(IDType.BlockID),
        //     name: `${srcTemplate.name} copy`,
        //     type: srcTemplate.type,
        //     options: srcTemplate.options.slice(),
        // }
        // newBoard.cardProperties.splice(index + 1, 0, newTemplate)
        //
        // let description = 'duplicate property'
        // if (activeView.fields.viewType === 'table') {
        //     oldBlocks.push(activeView)
        //
        //     const newActiveView = createBoardView(activeView)
        //     newActiveView.fields.visiblePropertyIds.push(newTemplate.id)
        //     changedBlocks.push(newActiveView)
        //
        //     description = 'duplicate column'
        // }
        //
        // await this.updateBlocks(changedBlocks, oldBlocks, description)

        // ToDo: needs to update both board and view
    }

    async changePropertyTemplateOrder(board: Board, template: IPropertyTemplate, destIndex: number) {
        const templates = board.cardProperties
        const newValue = templates.slice()

        const srcIndex = templates.indexOf(template)
        Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)
        newValue.splice(destIndex, 0, newValue.splice(srcIndex, 1)[0])

        const newBoard = createBoard(board)
        newBoard.cardProperties = newValue

        await this.updateBoard(board.id, newBoard, board, 'reorder properties')
    }

    async deleteProperty(board: Board, views: BoardView[], cards: Card[], propertyId: string) {
        const newBoard = createBoard(board)
        newBoard.cardProperties = board.cardProperties.filter((o: IPropertyTemplate) => o.id !== propertyId)

        const oldBlocks: Block[] = []
        const changedBlocks: Block[] = []

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

        // ToDo: both operations should go in the same endpoint, as one tx
        await this.updateBoard(board.id, newBoard, board, 'delete property')
        await this.updateBlocks(board.id, changedBlocks, oldBlocks, 'delete property')
    }

    // Properties

    async insertPropertyOption(board: Board, template: IPropertyTemplate, option: IPropertyOption, description = 'add option') {
        Utils.assert(board.cardProperties.includes(template))

        const newBoard = createBoard(board)
        const newTemplate = newBoard.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!
        newTemplate.options.push(option)

        await this.updateBoard(board.id, newBoard, board, description)
    }

    async deletePropertyOption(board: Board, template: IPropertyTemplate, option: IPropertyOption) {
        const newBoard = createBoard(board)
        const newTemplate = newBoard.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!
        newTemplate.options = newTemplate.options.filter((o) => o.id !== option.id)

        await this.updateBoard(board.id, newBoard, board, 'delete option')
    }

    async changePropertyOptionOrder(board: Board, template: IPropertyTemplate, option: IPropertyOption, destIndex: number) {
        const srcIndex = template.options.indexOf(option)
        Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)

        const newBoard = createBoard(board)
        const newTemplate = newBoard.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!
        newTemplate.options.splice(destIndex, 0, newTemplate.options.splice(srcIndex, 1)[0])

        await this.updateBoard(board.id, newBoard, board, 'reorder options')
    }

    async changePropertyOptionValue(board: Board, propertyTemplate: IPropertyTemplate, option: IPropertyOption, value: string) {
        const newBoard = createBoard(board)
        const newTemplate = newBoard.cardProperties.find((o: IPropertyTemplate) => o.id === propertyTemplate.id)!
        const newOption = newTemplate.options.find((o) => o.id === option.id)!
        newOption.value = value

        await this.updateBoard(board.id, newBoard, board, 'rename option')

        return newBoard
    }

    async changePropertyOptionColor(board: Board, template: IPropertyTemplate, option: IPropertyOption, color: string) {
        const newBoard = createBoard(board)
        const newTemplate = newBoard.cardProperties.find((o: IPropertyTemplate) => o.id === template.id)!
        const newOption = newTemplate.options.find((o) => o.id === option.id)!
        newOption.color = color
        await this.updateBoard(board.id, newBoard, board, 'change option color')
    }

    async changePropertyValue(boardId: string, card: Card, propertyId: string, value?: string | string[], description = 'change property') {
        const oldValue = card.fields.properties[propertyId]

        // dont save anything if property value was not changed.
        if (oldValue === value) {
            return
        }

        const newCard = createCard(card)
        if (value) {
            newCard.fields.properties[propertyId] = value
        } else {
            delete newCard.fields.properties[propertyId]
        }
        await this.updateBlock(boardId, newCard, card, description)
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.EditCardProperty, {board: card.rootId, card: card.id})
    }

    async changePropertyTypeAndName(board: Board, cards: Card[], propertyTemplate: IPropertyTemplate, newType: PropertyType, newName: string) {
        // ToDo: implement

        // if (propertyTemplate.type === newType && propertyTemplate.name === newName) {
        //     return
        // }
        //
        // const newBoard = createBoard(board)
        // const newTemplate = newBoard.cardProperties.find((o: IPropertyTemplate) => o.id === propertyTemplate.id)!
        //
        // if (propertyTemplate.type !== newType) {
        //     newTemplate.options = []
        // }
        //
        // newTemplate.type = newType
        // newTemplate.name = newName
        //
        // const oldBlocks: Block[] = [board]
        // const newBlocks: Block[] = [newBoard]
        //
        // if (propertyTemplate.type !== newType) {
        //     if (propertyTemplate.type === 'select' || propertyTemplate.type === 'multiSelect') { // If the old type was either select or multiselect
        //         const isNewTypeSelectOrMulti = newType === 'select' || newType === 'multiSelect'
        //
        //         for (const card of cards) {
        //             const oldValue = Array.isArray(card.fields.properties[propertyTemplate.id]) ? (card.fields.properties[propertyTemplate.id].length > 0 && card.fields.properties[propertyTemplate.id][0]) : card.fields.properties[propertyTemplate.id]
        //             if (oldValue) {
        //                 const newValue = isNewTypeSelectOrMulti ? propertyTemplate.options.find((o) => o.id === oldValue)?.id : propertyTemplate.options.find((o) => o.id === oldValue)?.value
        //                 const newCard = createCard(card)
        //
        //                 if (newValue) {
        //                     newCard.fields.properties[propertyTemplate.id] = newType === 'multiSelect' ? [newValue] : newValue
        //                 } else {
        //                     // This was an invalid select option, so delete it
        //                     delete newCard.fields.properties[propertyTemplate.id]
        //                 }
        //
        //                 newBlocks.push(newCard)
        //                 oldBlocks.push(card)
        //             }
        //
        //             if (isNewTypeSelectOrMulti) {
        //                 newTemplate.options = propertyTemplate.options
        //             }
        //         }
        //     } else if (newType === 'select' || newType === 'multiSelect') { // if the new type is either select or multiselect
        //         // Map values to new template option IDs
        //         for (const card of cards) {
        //             const oldValue = card.fields.properties[propertyTemplate.id] as string
        //             if (oldValue) {
        //                 let option = newTemplate.options.find((o: IPropertyOption) => o.value === oldValue)
        //                 if (!option) {
        //                     option = {
        //                         id: Utils.createGuid(IDType.None),
    //                         value: oldValue,
    //                         color: 'propColorDefault',
    //                     }
        //                     newTemplate.options.push(option)
        //                 }
        //
        //                 const newCard = createCard(card)
        //                 newCard.fields.properties[propertyTemplate.id] = newType === 'multiSelect' ? [option.id] : option.id
        //
        //                 newBlocks.push(newCard)
        //                 oldBlocks.push(card)
        //             }
        //         }
        //     }
        // }
        //
        // await this.updateBlocks(newBlocks, oldBlocks, 'change property type and name')
    }

    // Views

    async changeViewSortOptions(boardId: string, viewId: string, oldSortOptions: ISortOption[], sortOptions: ISortOption[]): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {sortOptions}})
            },
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {sortOptions: oldSortOptions}})
            },
            'sort',
            this.undoGroupId,
        )
    }

    async changeViewFilter(boardId: string, viewId: string, oldFilter: FilterGroup, filter: FilterGroup): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {filter}})
            },
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {filter: oldFilter}})
            },
            'filter',
            this.undoGroupId,
        )
    }

    async changeViewGroupById(boardId: string, viewId: string, oldGroupById: string|undefined, groupById: string): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {groupById}})
            },
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {groupById: oldGroupById}})
            },
            'group by',
            this.undoGroupId,
        )
    }

    async changeViewDateDisplayPropertyId(boardId: string, viewId: string, oldDateDisplayPropertyId: string|undefined, dateDisplayPropertyId: string): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {dateDisplayPropertyId}})
            },
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {dateDisplayPropertyId: oldDateDisplayPropertyId}})
            },
            'display by',
            this.undoDisplayId,
        )
    }

    async changeViewVisibleProperties(boardId: string, viewId: string, oldVisiblePropertyIds: string[], visiblePropertyIds: string[], description = 'show / hide property'): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {visiblePropertyIds}})
            },
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {visiblePropertyIds: oldVisiblePropertyIds}})
            },
            description,
            this.undoGroupId,
        )
    }

    async changeViewVisibleOptionIds(boardId: string, viewId: string, oldVisibleOptionIds: string[], visibleOptionIds: string[], description = 'reorder'): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {visibleOptionIds}})
            },
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {visibleOptionIds: oldVisibleOptionIds}})
            },
            description,
            this.undoGroupId,
        )
    }

    async changeViewHiddenOptionIds(boardId: string, viewId: string, oldHiddenOptionIds: string[], hiddenOptionIds: string[], description = 'reorder'): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {hiddenOptionIds}})
            },
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {hiddenOptionIds: oldHiddenOptionIds}})
            },
            description,
            this.undoGroupId,
        )
    }

    async changeViewKanbanCalculations(boardId: string, viewId: string, oldCalculations: Record<string, KanbanCalculationFields>, calculations: Record<string, KanbanCalculationFields>, description = 'updated kanban calculations'): Promise<void> {
        await undoManager.perform(
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {kanbanCalculations: calculations}})
            },
            async () => {
                await octoClient.patchBlock(boardId, viewId, {updatedFields: {kanbanCalculations: oldCalculations}})
            },
            description,
            this.undoGroupId,
        )
    }

    async hideViewColumn(boardId: string, view: BoardView, columnOptionId: string): Promise<void> {
        if (view.fields.hiddenOptionIds.includes(columnOptionId)) {
            return
        }

        const newView = createBoardView(view)
        newView.fields.visibleOptionIds = newView.fields.visibleOptionIds.filter((o) => o !== columnOptionId)
        newView.fields.hiddenOptionIds = [...newView.fields.hiddenOptionIds, columnOptionId]
        await this.updateBlock(boardId, newView, view, 'hide column')
    }

    async unhideViewColumn(boardId: string, view: BoardView, columnOptionId: string): Promise<void> {
        if (!view.fields.hiddenOptionIds.includes(columnOptionId)) {
            return
        }

        const newView = createBoardView(view)
        newView.fields.hiddenOptionIds = newView.fields.hiddenOptionIds.filter((o) => o !== columnOptionId)

        // Put the column at the end of the visible list
        newView.fields.visibleOptionIds = newView.fields.visibleOptionIds.filter((o) => o !== columnOptionId)
        newView.fields.visibleOptionIds = [...newView.fields.visibleOptionIds, columnOptionId]
        await this.updateBlock(boardId, newView, view, 'show column')
    }

    async changeViewCardOrder(boardId: string, view: BoardView, cardOrder: string[], description = 'reorder'): Promise<void> {
        const newView = createBoardView(view)
        newView.fields.cardOrder = cardOrder
        await this.updateBlock(boardId, newView, view, description)
    }

    async createCategory(category: Category): Promise<void> {
        await octoClient.createSidebarCategory(category)
    }

    async deleteCategory(teamID: string, categoryID: string): Promise<void> {
        await octoClient.deleteSidebarCategory(teamID, categoryID)
    }

    async updateCategory(category: Category): Promise<void> {
        await octoClient.updateSidebarCategory(category)
    }

    async moveBlockToCategory(teamID: string, blockID: string, toCategoryID: string, fromCategoryID: string): Promise<void> {
        await octoClient.moveBlockToCategory(teamID, blockID, toCategoryID, fromCategoryID)
    }

    // Duplicate

    async duplicateCard(
        cardId: string,
        board: Board,
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
            if (!newCard.fields.icon && UserSettings.prefillRandomIcons) {
                newCard.fields.icon = BlockIcons.shared.randomIcon()
            }
        }
        newCard.fields.isTemplate = asTemplate
        newCard.rootId = board.id
        newCard.parentId = board.id
        await this.insertBlocks(
            board.id,
            newBlocks,
            description,
            async (respBlocks: Block[]) => {
                await afterRedo?.(respBlocks[0].id)
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
        // ToDo: reimplement

        // const blocks = await octoClient.getSubtree(boardId, 3)
        // const [newBlocks1, newBoard] = OctoUtils.duplicateBlockTree(blocks, boardId) as [Block[], Board, Record<string, string>]
        // const newBlocks = newBlocks1.filter((o) => o.type !== 'comment')
        // Utils.log(`duplicateBoard: duplicating ${newBlocks.length} blocks`)
        //
        // if (asTemplate === newBoard.isTemplate) {
        //     newBoard.title = `${newBoard.title} copy`
        // } else if (asTemplate) {
        //     // Template from board
        //     newBoard.title = 'New board template'
        // } else {
        //     // Board from template
        // }
        // newBoard.isTemplate = asTemplate
        // const createdBlocks = await this.insertBlocks(
        //     newBlocks,
        //     description,
        //     async (respBlocks: Block[]) => {
        //         await afterRedo?.(respBlocks[0].id)
        //     },
        //     beforeUndo,
        // )
        // return [createdBlocks, createdBlocks[0].id]
        return [[], '']
    }

    async duplicateFromRootBoard(
        boardId: string,
        description = 'duplicate board',
        asTemplate = false,
        afterRedo?: (newBoardId: string) => Promise<void>,
        beforeUndo?: () => Promise<void>,
    ): Promise<[Block[], string]> {
        // ToDo: reimplement, needs to duplicate board and blocks

        // const rootClient = new OctoClient(octoClient.serverUrl, '0')
        // const blocks = await rootClient.getSubtree(boardId, 3, '0')
        // const [newBlocks1, newBoard] = OctoUtils.duplicateBlockTree(blocks, boardId) as [Block[], Board, Record<string, string>]
        // const newBlocks = newBlocks1.filter((o) => o.type !== 'comment')
        // Utils.log(`duplicateBoard: duplicating ${newBlocks.length} blocks`)
        //
        // if (asTemplate === newBoard.isTemplate) {
        //     newBoard.title = `${newBoard.title} copy`
        // } else if (asTemplate) {
        //     // Template from board
        //     newBoard.title = 'New board template'
        // } else {
        //     // Board from template
        // }
        // newBoard.isTemplate = asTemplate
        // const createdBlocks = await this.insertBlocks(
        //     newBlocks,
        //     description,
        //     async (respBlocks: Block[]) => {
        //         await afterRedo?.(respBlocks[0].id)
        //     },
        //     beforeUndo,
        // )
        // return [createdBlocks, createdBlocks[0].id]
        return [[], '']
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
