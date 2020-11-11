// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Card, MutableCard} from '../blocks/card'
import {IOrderedBlock} from '../blocks/orderedBlock'
import octoClient from '../octoClient'
import {IBlock, MutableBlock} from '../blocks/block'
import {OctoUtils} from '../octoUtils'
import {Utils} from '../utils'

interface CardTree {
    readonly card: Card
    readonly comments: readonly IBlock[]
    readonly contents: readonly IOrderedBlock[]

    mutableCopy(): MutableCardTree
    templateCopy(): MutableCardTree
}

class MutableCardTree implements CardTree {
    card: MutableCard
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
        const relevantBlocks = updatedBlocks.filter((block) => block.deleteAt !== 0 || block.id === this.cardId || block.parentId === this.cardId)
        if (relevantBlocks.length < 1) {
            return false
        }
        this.rawBlocks = OctoUtils.mergeBlocks(this.rawBlocks, relevantBlocks)
        this.rebuild(OctoUtils.hydrateBlocks(this.rawBlocks))
        return true
    }

    private rebuild(blocks: IBlock[]) {
        this.card = blocks.find((o) => o.id === this.cardId) as MutableCard

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

    templateCopy(): MutableCardTree {
        const card = this.card.duplicate()

        const contents: IOrderedBlock[] = this.contents.map((content) => {
            const copy = MutableBlock.duplicate(content)
            copy.parentId = card.id
            return copy as IOrderedBlock
        })

        const cardTree = new MutableCardTree(card.id)
        cardTree.incrementalUpdate([card, ...contents])
        return cardTree
    }
}

export {MutableCardTree, CardTree}
