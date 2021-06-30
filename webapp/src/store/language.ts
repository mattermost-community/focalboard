// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit'

import {getCurrentLanguage, storeLanguage as i18nStoreLanguage} from '../i18n'

import {RootState} from './index'

export const fetchLanguage = createAsyncThunk(
    'language/fetch',
    async () => getCurrentLanguage(),
)

export const storeLanguage = createAsyncThunk(
    'language/store',
    async (lang: string) => {
        i18nStoreLanguage(lang)
        return lang
    },
)

const langaugeSlice = createSlice({
    name: 'langauge',
    initialState: {value: 'en'} as {value: string},
    reducers: {
        setLanguage: (state, action: PayloadAction<string>) => {
            state.value = action.payload
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchLanguage.fulfilled, (state, action) => {
            state.value = action.payload
        })
        builder.addCase(storeLanguage.fulfilled, (state, action) => {
            state.value = action.payload
        })
    },
})

export const {reducer} = langaugeSlice

export function getLanguage(state: RootState): string {
    return state.language.value
}
