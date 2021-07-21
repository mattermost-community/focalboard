// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from '../utils'

import {IBlock, Block} from './block'
import {FilterGroup} from './filterGroup'

type IViewType = 'board' | 'table' | 'gallery' // | 'calendar' | 'list'
type ISortOption = { propertyId: '__title' | string, reversed: boolean }

type BoardViewFields = {
    viewType: IViewType
    groupById?: string
    sortOptions: ISortOption[]
    visiblePropertyIds: string[]
    visibleOptionIds: string[]
    hiddenOptionIds: string[]
    collapsedOptionIds: string[]
    filter: FilterGroup
    cardOrder: string[]
    columnWidths: Record<string, number>
}

class BoardView extends Block {
    fields: BoardViewFields

    constructor(block?: IBlock) {
        super(block)

        this.type = 'view'

        this.fields = {
            viewType: block?.fields.viewType || 'board',
            sortOptions: block?.fields.sortOptions?.map((o: ISortOption) => ({...o})) || [],
            visiblePropertyIds: block?.fields.visiblePropertyIds?.slice() || [],
            visibleOptionIds: block?.fields.visibleOptionIds?.slice() || [],
            hiddenOptionIds: block?.fields.hiddenOptionIds?.slice() || [],
            collapsedOptionIds: block?.fields.collapsedOptionIds?.slice() || [],
            filter: new FilterGroup(block?.fields.filter),
            cardOrder: block?.fields.cardOrder?.slice() || [],
            columnWidths: {...(block?.fields.columnWidths || {})},
        }
    }

    duplicate(): BoardView {
        const view = new BoardView(this)
        view.id = Utils.createGuid()
        return view
    }
}

function sortBoardViewsAlphabetically(views: BoardView[]): BoardView[] {
    // Strip leading emoji to prevent unintuitive results
    return views.map((v) => {
        return {view: v, title: v.title.replace(/^\p{Emoji}*\s*/u, '')}
    }).sort((v1, v2) => v1.title.localeCompare(v2.title)).map((v) => v.view)
}

export {BoardView, IViewType, ISortOption, sortBoardViewsAlphabetically}
