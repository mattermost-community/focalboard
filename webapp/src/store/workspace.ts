// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction, createSelector} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {IWorkspace} from '../blocks/workspace'

import {UserWorkspace} from '../user'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

export const fetchWorkspace = createAsyncThunk(
    'workspace/fetch',
    async () => client.getWorkspace(),
)

type WorkspaceState = {
    current: IWorkspace|null
    userWorkspaces: UserWorkspace[]
}

const workspaceSlice = createSlice({
    name: 'workspace',
    initialState: {current: null} as WorkspaceState,
    reducers: {
        setWorkspace: (state, action: PayloadAction<IWorkspace>) => {
            state.current = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.current = action.payload.workspace || null
            state.userWorkspaces = action.payload.userWorkspaces
        })
        builder.addCase(fetchWorkspace.fulfilled, (state, action) => {
            state.current = action.payload || null
        })
    },
})

export const {setWorkspace} = workspaceSlice.actions
export const {reducer} = workspaceSlice

export const getUserWorkspaces = (state: RootState): UserWorkspace[] => state.workspace.userWorkspaces

export const getUserWorkspaceList = createSelector(
    getUserWorkspaces,
    (userWorkspaces) => userWorkspaces,
)

export function getCurrentWorkspace(state: RootState): IWorkspace|null {
    return state.workspace.current
}
