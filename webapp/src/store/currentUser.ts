// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {IUser} from '../user'

import {RootState} from './index'

export const fetchCurrentUser = createAsyncThunk(
    'currentUser/fetch',
    async () => client.getMe(),
)

const currentUserSlice = createSlice({
    name: 'currentUser',
    initialState: {value: null} as {value: IUser|null},
    reducers: {
        setUser: (state, action: PayloadAction<IUser>) => {
            state.value = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
            state.value = action.payload || null
        })
    },
})

export const {setUser} = currentUserSlice.actions
export const {reducer} = currentUserSlice

export function getCurrentUser(state: RootState): IUser|null {
    return state.currentUser.value
}
