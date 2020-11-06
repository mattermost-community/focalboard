// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Card} from '../blocks/card'
import {IOrderedBlock} from '../blocks/orderedBlock'
import octoClient from '../octoClient'
import {IBlock} from '../blocks/block'
import {OctoUtils} from '../octoUtils'

interface CardTree {
    readonly card: Card
    readonly comments: readonly IBlock[]
    readonly contents: readonly IOrderedBlock[]

    mutableCopy(): MutableCardTree
}

class MutableCardTree implements CardTree {
    card: Card
    comments: IBlock[] = []
    contents: IOrderedBlock[] = []

    private rawBlocks: IBlock[] = []

    constructor(private cardId: string) {
    }

    async sync() {
        this.rawBlocks = await octoClient.getSubtree(this.cardId)
        this.rebuild(OctoUtils.hydrateBlocks(this.rawBlocks))
    }

    incrementalUpdate(updatedBlocks: IBlock[]): boolean {
        const relevantBlocks = updatedBlocks.filter((block) => block.id === this.cardId || block.parentId === this.cardId)
        if (relevantBlocks.length < 1) {
            return false
        }
        this.rawBlocks = OctoUtils.mergeBlocks(this.rawBlocks, relevantBlocks)
        this.rebuild(OctoUtils.hydrateBlocks(this.rawBlocks))
        return true
    }

    private rebuild(blocks: IBlock[]) {
        this.card = blocks.find((o) => o.id === this.cardId) as Card

        this.comments = blocks.
            filter((block) => block.type === 'comment').
            sort((a, b) => a.createAt - b.createAt)

        const contentBlocks = blocks.filter((block) => block.type === 'text' || block.type === 'image' || block.type === 'divider') as IOrderedBlock[]
        this.contents = contentBlocks.sort((a, b) => a.order - b.order)
    }

    mutableCopy(): MutableCardTree {
        const cardTree = new MutableCardTree(this.cardId)
        cardTree.incrementalUpdate(this.rawBlocks)
        return cardTree
    }
}

export {MutableCardTree, CardTree}
