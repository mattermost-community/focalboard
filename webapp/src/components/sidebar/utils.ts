// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CategoryBoards, DefaultCategory} from '../../store/sidebar'

import {Block} from '../../blocks/block'
import {Board} from '../../blocks/board'

export function addMissingItems(sidebarCategories: Array<CategoryBoards>, allItems: Array<Block | Board>): Array<CategoryBoards> {
    const blocksInCategories = new Map<string, boolean>()
    sidebarCategories.forEach(
        (category) => category.boardIDs.forEach(
            (boardID) => blocksInCategories.set(boardID, true),
        ),
    )

    const defaultCategory: CategoryBoards = {
        ...DefaultCategory,
        boardIDs: [],
    }

    allItems.forEach((block) => {
        if (!blocksInCategories.get(block.id)) {
            defaultCategory.boardIDs.push(block.id)
        }
    })

    // sidebarCategories comes from store,
    // so is frozen and can't be extended.
    // So creating new array from it.
    return [
        ...sidebarCategories,
        defaultCategory,
    ]
}
