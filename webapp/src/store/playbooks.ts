// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {VirtualLink} from '../virtual'

import {RootState} from './index'

export const fetchPlaybooks = createAsyncThunk(
    'playbooks/fetch',
    async ({teamId}: {teamId: string}) => {
        const playbooks = await client.getVirtualLinksForDriver('playbooks', teamId)
        return playbooks
    },
)

export type PlaybooksIdData = Record<string, VirtualLink>
export type StatusFetch = 'idle' | 'requesting' | 'fulfilled' | 'error'

const playbooksSlice = createSlice({
    name: 'playbooks',
    initialState: {value: {}, status: 'idle'} as {value: PlaybooksIdData, status: StatusFetch},
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchPlaybooks.fulfilled, (state, action) => {
            if (action.payload == null) {
                state.value = {}
            } else {
                state.value = action.payload.reduce((acc: PlaybooksIdData, item: VirtualLink) => {
                    acc[item.id] = item
                    return acc
                }, {})
            }
            state.status = 'fulfilled'
        })
    },
})

export const {reducer} = playbooksSlice

export function getPlaybooks(state: RootState): PlaybooksIdData {
    return state.playbooks.value
}

export function getPlaybooksFetchStatus(state: RootState): StatusFetch {
    return state.playbooks.status
}
