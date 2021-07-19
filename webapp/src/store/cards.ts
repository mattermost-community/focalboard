// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction} from '@reduxjs/toolkit'

import {MutableCard, Card} from '../blocks/card'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

const cardsSlice = createSlice({
    name: 'cards',
    initialState: {cards: [], templates: []} as {cards: MutableCard[], templates: MutableCard[]},
    reducers: {
        updateCards: (state, action: PayloadAction<MutableCard[]>) => {
            const updatedCardIds = action.payload.filter((o: Card) => !o.fields.isTemplate).map((o: Card) => o.id)
            const newCards = state.cards.filter((o: Card) => !updatedCardIds.includes(o.id))
            const updatedAndNotDeletedCards = action.payload.filter((o: Card) => o.deleteAt === 0 && !o.fields.isTemplate)
            newCards.push(...updatedAndNotDeletedCards)
            state.cards = newCards.sort((a, b) => a.title.localeCompare(b.title)) as MutableCard[]

            const updatedTemplateIds = action.payload.filter((o: Card) => o.fields.isTemplate).map((o: Card) => o.id)
            const newTemplates = state.cards.filter((o: Card) => !updatedTemplateIds.includes(o.id))
            const updatedAndNotDeletedTemplates = action.payload.filter((o: Card) => o.deleteAt === 0 && o.fields.isTemplate)
            newTemplates.push(...updatedAndNotDeletedTemplates)
            state.templates = newTemplates.sort((a, b) => a.title.localeCompare(b.title)) as MutableCard[]
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.cards = action.payload.blocks.filter((block) => block.type === 'card' && !block.fields.isTemplate).
                sort((a, b) => a.title.localeCompare(b.title)) as MutableCard[]
            state.templates = action.payload.blocks.filter((block) => block.type === 'card' && block.fields.isTemplate).
                sort((a, b) => a.title.localeCompare(b.title)) as MutableCard[]
        })
    },
})

export const {updateCards} = cardsSlice.actions
export const {reducer} = cardsSlice

export function getCards(state: RootState): Card[] {
    return state.cards.cards
}

export function getTemplates(state: RootState): Card[] {
    return state.cards.templates
}
