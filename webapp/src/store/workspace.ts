// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {IWorkspace} from '../blocks/workspace'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

export const fetchWorkspace = createAsyncThunk(
    'workspace/fetch',
    async () => client.getWorkspace(),
)

const workspaceSlice = createSlice({
    name: 'workspace',
    initialState: {value: null} as {value: IWorkspace|null},
    reducers: {
        setWorkspace: (state, action: PayloadAction<IWorkspace>) => {
            state.value = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.value = action.payload.workspace || null
        })
        builder.addCase(fetchWorkspace.fulfilled, (state, action) => {
            state.value = action.payload || null
        })
    },
})

export const {setWorkspace} = workspaceSlice.actions
export const {reducer} = workspaceSlice

export function getWorkspace(state: RootState): IWorkspace|null {
    return state.workspace.value
}
