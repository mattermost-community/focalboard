// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {IWorkspace} from '../blocks/workspace'

import {RootState} from './index'

export const fetchCurrentWorkspace = createAsyncThunk(
    'currentWorkspace/fetch',
    async () => client.getWorkspace(),
)

const currentWorkspaceSlice = createSlice({
    name: 'currentWorkspace',
    initialState: {value: null} as {value: IWorkspace|null},
    reducers: {
        setWorkspace: (state, action: PayloadAction<IWorkspace>) => {
            state.value = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCurrentWorkspace.fulfilled, (state, action) => {
            state.value = action.payload || null
        })
    },
})

export const {setWorkspace} = currentWorkspaceSlice.actions
export const {reducer} = currentWorkspaceSlice

export function getCurrentWorkspace(state: RootState): IWorkspace|null {
    return state.currentWorkspace.value
}
