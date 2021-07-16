// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'

import {default as client, OctoClient} from '../octoClient'
import {MutableBoard} from '../blocks/board'

import {RootState} from './index'

export const fetchGlobalTemplates = createAsyncThunk(
    'globalTemplates/fetch',
    async () => {
        const rootClient = new OctoClient(client.serverUrl, '0')
        const rawBlocks = await rootClient.getBlocksWithType('board')
        const allBoards = rawBlocks as MutableBoard[]
        return allBoards.filter((block) => block.fields.isTemplate).sort((a, b) => a.title.localeCompare(b.title)) as MutableBoard[]
    },
)

const globalTemplatesSlice = createSlice({
    name: 'globalTemplates',
    initialState: {value: []} as {value: MutableBoard[]},
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchGlobalTemplates.fulfilled, (state, action) => {
            state.value = action.payload || []
        })
    },
})

export const {reducer} = globalTemplatesSlice

export function getGlobalTemplates(state: RootState): MutableBoard[] {
    return state.globalTemplates.value
}
