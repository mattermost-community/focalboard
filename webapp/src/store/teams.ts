// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit'

import octoClient from '../octoClient'

import {SuiteWindow} from '../types'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

export interface Team {
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

            const windowAny = (window as any)
            if (windowAny.setTeam) {
                windowAny.setTeam(action.payload.id)
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.current = action.payload.team

            const windowAny = (window as any)
            if (windowAny.setTeam && action.payload?.team?.id) {
                windowAny.setTeam(action.payload.team?.id)
            }
        })
        builder.addCase(fetchTeams.fulfilled, (state, action) => {
            state.allTeams = action.payload
        })
    },
})

export const {setTeam} = teamSlice.actions
export const {reducer} = teamSlice

export const getCurrentTeam = (state: RootState): Team|null => state.teams.current
