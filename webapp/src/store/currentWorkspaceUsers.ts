// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {IUser} from '../user'

import {RootState} from './index'

export const fetchCurrentWorkspaceUsers = createAsyncThunk(
    'currentWorkspaceUsers/fetch',
    async () => client.getWorkspaceUsers(),
)

const currentWorkspaceUsersSlice = createSlice({
    name: 'currentWorkspaceUsers',
    initialState: {list: [], byId: {}} as {list: IUser[], byId: {[key: string]: IUser}},
    reducers: {
        setWorkspaceUsers: (state, action: PayloadAction<Array<IUser>>) => {
            state.list = action.payload || []
            state.byId = action.payload.reduce((acc: {[key: string]: IUser}, user: IUser) => {
                acc[user.id] = user
                return acc
            }, {})
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCurrentWorkspaceUsers.fulfilled, (state, action) => {
            state.list = action.payload || []
            state.byId = action.payload.reduce((acc: {[key: string]: IUser}, user: IUser) => {
                acc[user.id] = user
                return acc
            }, {})
        })
    },
})

export const {setWorkspaceUsers} = currentWorkspaceUsersSlice.actions
export const {reducer} = currentWorkspaceUsersSlice

export function getCurrentWorkspaceUsers(state: RootState): IUser[] {
    return state.currentWorkspaceUsers.list
}

export function getCurrentWorkspaceUsersById(state: RootState): {[key: string]: IUser} {
    return state.currentWorkspaceUsers.byId
}
