// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {MutableBoardView, sortBoardViewsAlphabetically} from './boardView'

test('boardView: sort with ASCII', async () => {
    const view1 = new MutableBoardView()
    view1.title = 'Maybe'
    const view2 = new MutableBoardView()
    view2.title = 'Active'

    const views = [view1, view2]
    const sorted = sortBoardViewsAlphabetically(views)
    expect(sorted).toEqual([view2, view1])
})

test('boardView: sort with leading emoji', async () => {
    const view1 = new MutableBoardView()
    view1.title = '🤔 Maybe'
    const view2 = new MutableBoardView()
    view2.title = '🚀 Active'

    const views = [view1, view2]
    const sorted = sortBoardViewsAlphabetically(views)
    expect(sorted).toEqual([view2, view1])
})

test('boardView: sort with non-latin characters', async () => {
    const view1 = new MutableBoardView()
    view1.title = 'zebra'
    const view2 = new MutableBoardView()
    view2.title = 'ñu'

    const views = [view1, view2]
    const sorted = sortBoardViewsAlphabetically(views)
    expect(sorted).toEqual([view2, view1])
})
