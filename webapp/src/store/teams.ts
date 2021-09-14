// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {ITeam} from '../blocks/team'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

export const fetchTeam = createAsyncThunk(
    'team/fetch',
    async () => client.getTeam(),
)

const teamSlice = createSlice({
    name: 'team',
    initialState: {current: null} as {current: ITeam|null},
    reducers: {
        setTeam: (state, action: PayloadAction<ITeam>) => {
            state.current = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.current = action.payload.team || null
        })
        builder.addCase(fetchTeam.fulfilled, (state, action) => {
            state.current = action.payload || null
        })
    },
})

export const {setTeam} = teamSlice.actions
export const {reducer} = teamSlice

export function getTeam(state: RootState): ITeam|null {
    return state.teams.current
}
