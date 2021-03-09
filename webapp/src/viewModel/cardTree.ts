// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {ContentBlockTypes, contentBlockTypes, IBlock} from '../blocks/block'
import {Card, MutableCard} from '../blocks/card'
import {CommentBlock} from '../blocks/commentBlock'
import {IContentBlock} from '../blocks/contentBlock'
import octoClient from '../octoClient'
import {OctoUtils} from '../octoUtils'

interface CardTree {
    readonly card: Card
    readonly comments: readonly CommentBlock[]
    readonly contents: readonly IContentBlock[]
    readonly allBlocks: readonly IBlock[]
}

class MutableCardTree implements CardTree {
    card: MutableCard
    comments: CommentBlock[] = []
    contents: IContentBlock[] = []

    get allBlocks(): IBlock[] {
        return [this.card, ...this.comments, ...this.contents]
    }

    constructor(card: MutableCard) {
        this.card = card
    }

    // Factory methods

    static async sync(boardId: string): Promise<CardTree | undefined> {
        const rawBlocks = await octoClient.getSubtree(boardId)
        return this.buildTree(boardId, rawBlocks)
    }

    static incrementalUpdate(cardTree: CardTree, updatedBlocks: IBlock[]): CardTree | undefined {
        const relevantBlocks = updatedBlocks.filter((block) => block.deleteAt !== 0 || block.id === cardTree.card.id || block.parentId === cardTree.card.id)
        if (relevantBlocks.length < 1) {
            // No change
            return cardTree
        }
        const rawBlocks = OctoUtils.mergeBlocks(cardTree.allBlocks, relevantBlocks)
        return this.buildTree(cardTree.card.id, rawBlocks)
    }

    private static buildTree(cardId: string, sourceBlocks: readonly IBlock[]): MutableCardTree | undefined {
        const blocks = OctoUtils.hydrateBlocks(sourceBlocks)

        const card = blocks.find((o) => o.type === 'card' && o.id === cardId) as MutableCard
        if (!card) {
            return undefined
        }
        const cardTree = new MutableCardTree(card)
        cardTree.comments = blocks.
            filter((block) => block.type === 'comment').
            sort((a, b) => a.createAt - b.createAt) as CommentBlock[]

        const contentBlocks = blocks.filter((block) => contentBlockTypes.includes(block.type as ContentBlockTypes)) as IContentBlock[]
        cardTree.contents = OctoUtils.getBlockOrder(card.contentOrder, contentBlocks)

        return cardTree
    }

    // private mutableCopy(): MutableCardTree {
    //     return MutableCardTree.buildTree(this.card.id, this.allBlocks)!
    // }
}

export {MutableCardTree, CardTree}
