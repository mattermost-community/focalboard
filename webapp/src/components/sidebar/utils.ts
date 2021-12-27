// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CategoryBlocks, DefaultCategory} from '../../store/sidebar'

import {Block} from '../../blocks/block'

export function addMissingBlocks(sidebarCategories: Array<CategoryBlocks>, allBlocks: Array<Block>): Array<CategoryBlocks> {
    const blocksInCategories = new Map<string, boolean>()
    sidebarCategories.forEach(
        (category) => category.blockIDs.forEach(
            (blockID) => blocksInCategories.set(blockID, true),
        ),
    )

    const defaultCategory: CategoryBlocks = {
        ...DefaultCategory,
        blockIDs: [],
    }

    allBlocks.forEach((block) => {
        if (!blocksInCategories.get(block.id)) {
            defaultCategory.blockIDs.push(block.id)
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
