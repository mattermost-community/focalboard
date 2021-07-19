// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction} from '@reduxjs/toolkit'

import {IUser} from '../user'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

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
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.list = action.payload.workspaceUsers || []
            state.byId = state.list.reduce((acc: {[key: string]: IUser}, user: IUser) => {
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
