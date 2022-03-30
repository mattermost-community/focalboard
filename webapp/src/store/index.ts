// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {configureStore} from '@reduxjs/toolkit'

import {reducer as usersReducer} from './users'

// import {reducer as workspaceReducer} from './workspace'
import {reducer as teamReducer} from './teams'
import {reducer as languageReducer} from './language'
import {reducer as globalTemplatesReducer} from './globalTemplates'
import {reducer as boardsReducer} from './boards'
import {reducer as viewsReducer} from './views'
import {reducer as cardsReducer} from './cards'
import {reducer as contentsReducer} from './contents'
import {reducer as commentsReducer} from './comments'
import {reducer as searchTextReducer} from './searchText'
import {reducer as globalErrorReducer} from './globalError'
import {reducer as clientConfigReducer} from './clientConfig'
import {reducer as sidebarReducer} from './sidebar'

const store = configureStore({
    reducer: {
        users: usersReducer,

        // workspace: workspaceReducer,
        teams: teamReducer,
        language: languageReducer,
        globalTemplates: globalTemplatesReducer,
        boards: boardsReducer,
        views: viewsReducer,
        cards: cardsReducer,
        contents: contentsReducer,
        comments: commentsReducer,
        searchText: searchTextReducer,
        globalError: globalErrorReducer,
        clientConfig: clientConfigReducer,
        sidebar: sidebarReducer,
    },
})

export default store

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
