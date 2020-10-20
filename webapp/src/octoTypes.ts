// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
interface IBlock {
    id: string
    parentId: string

    schema: number
    type: string
    title?: string
    fields: Record<string, any>

    createAt: number
    updateAt: number
    deleteAt: number
}

interface IOrderedBlock extends IBlock {
    order: number
}

// These are methods exposed by the top-level page to components
interface IPageController {
    showBoard(boardId: string): void
    showView(viewId: string): void
    showFilter(anchorElement?: HTMLElement): void
    setSearchText(text?: string): void
}

export {IBlock, IOrderedBlock, IPageController}
