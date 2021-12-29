// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit'

import octoClient from '../octoClient'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

interface Team {
    id: string
    title: string
    signupToken: string
    modifiedBy: string
    updateAt:number
}

export const fetchTeams = createAsyncThunk(
    'team/fetch',
    async () => octoClient.getTeams(),
)

type TeamState = {
    current: Team | null
    allTeams: Array<Team>
}

const teamSlice = createSlice({
    name: 'teams',
    initialState: {
        current: null,
        allTeams: [],
    } as TeamState,
    reducers: {
        setTeam: (state, action: PayloadAction<Team>) => {
            state.current = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.current = action.payload.team
        })
        builder.addCase(fetchTeams.fulfilled, (state, action) => {
            state.allTeams = action.payload
        })
    },
})

export const {setTeam} = teamSlice.actions
export const {reducer} = teamSlice

export const getCurrentTeam = (state: RootState): Team|null => state.teams.current
