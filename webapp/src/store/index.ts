// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {configureStore} from '@reduxjs/toolkit'

import {reducer as usersReducer} from './users'
import {reducer as workspaceReducer} from './workspace'
import {reducer as languageReducer} from './language'
import {reducer as globalTemplatesReducer} from './globalTemplates'
import {reducer as boardsReducer} from './boards'
import {reducer as viewsReducer} from './views'
import {reducer as cardsReducer} from './cards'
import {reducer as contentsReducer} from './contents'
import {reducer as searchTextReducer} from './searchText'

const store = configureStore({
    reducer: {
        users: usersReducer,
        workspace: workspaceReducer,
        language: languageReducer,
        globalTemplates: globalTemplatesReducer,
        boards: boardsReducer,
        views: viewsReducer,
        cards: cardsReducer,
        contents: contentsReducer,
        searchText: searchTextReducer,
    },
})

export default store

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
