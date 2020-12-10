// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IBlock} from '../blocks/block'
import {Card, MutableCard} from '../blocks/card'
import {IOrderedBlock} from '../blocks/orderedBlock'
import octoClient from '../octoClient'
import {OctoUtils} from '../octoUtils'

interface CardTree {
    readonly card: Card
    readonly comments: readonly IBlock[]
    readonly contents: readonly IOrderedBlock[]
    readonly allBlocks: readonly IBlock[]

    mutableCopy(): MutableCardTree
}

class MutableCardTree implements CardTree {
    card: MutableCard
    comments: IBlock[] = []
    contents: IOrderedBlock[] = []

    get allBlocks(): IBlock[] {
        return [this.card, ...this.comments, ...this.contents]
    }

    constructor(card: MutableCard) {
        this.card = card
    }

    // Factory methods

    static async sync(boardId: string): Promise<MutableCardTree | undefined> {
        const rawBlocks = await octoClient.getSubtree(boardId)
        return this.buildTree(boardId, rawBlocks)
    }

    static incrementalUpdate(cardTree: CardTree, updatedBlocks: IBlock[]): MutableCardTree | undefined {
        const relevantBlocks = updatedBlocks.filter((block) => block.deleteAt !== 0 || block.id === cardTree.card.id || block.parentId === cardTree.card.id)
        if (relevantBlocks.length < 1) {
            // No change
            return cardTree.mutableCopy()
        }
        const rawBlocks = OctoUtils.mergeBlocks(cardTree.allBlocks, relevantBlocks)
        return this.buildTree(cardTree.card.id, rawBlocks)
    }

    static buildTree(cardId: string, sourceBlocks: readonly IBlock[]): MutableCardTree | undefined {
        const blocks = OctoUtils.hydrateBlocks(sourceBlocks)

        const card = blocks.find((o) => o.type === 'card' && o.id === cardId) as MutableCard
        if (!card) {
            return undefined
        }
        const cardTree = new MutableCardTree(card)
        cardTree.comments = blocks.
            filter((block) => block.type === 'comment').
            sort((a, b) => a.createAt - b.createAt)

        const contentBlocks = blocks.filter((block) => block.type === 'text' || block.type === 'image' || block.type === 'divider') as IOrderedBlock[]
        cardTree.contents = contentBlocks.sort((a, b) => a.order - b.order)

        return cardTree
    }

    mutableCopy(): MutableCardTree {
        return MutableCardTree.buildTree(this.card.id, this.allBlocks)!
    }
}

export {MutableCardTree, CardTree}
