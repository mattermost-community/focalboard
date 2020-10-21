// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
interface IBlock {
    readonly id: string
    readonly parentId: string

    readonly schema: number
    readonly type: string
    readonly title?: string
    readonly fields: Readonly<Record<string, any>>

    readonly createAt: number
    readonly updateAt: number
    readonly deleteAt: number
}

// These are methods exposed by the top-level page to components
interface IPageController {
    showBoard(boardId: string): void
    showView(viewId: string): void
    showFilter(anchorElement?: HTMLElement): void
    setSearchText(text?: string): void
}

export {IBlock, IPageController}
