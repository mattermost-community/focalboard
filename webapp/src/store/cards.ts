// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, PayloadAction, createSelector} from '@reduxjs/toolkit'

import {Card} from '../blocks/card'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

type CardsState = {
    current: string
    cards: {[key: string]: Card}
    templates: {[key: string]: Card}
}

const cardsSlice = createSlice({
    name: 'cards',
    initialState: {
        current: '',
        cards: {},
        templates: {},
    } as CardsState,
    reducers: {
        setCurrent: (state, action: PayloadAction<string>) => {
            state.current = action.payload
        },
        updateCards: (state, action: PayloadAction<Card[]>) => {
            for (const card of action.payload) {
                if (card.deleteAt !== 0) {
                    delete state.cards[card.id]
                    delete state.templates[card.id]
                } else if (card.fields.isTemplate) {
                    state.templates[card.id] = card
                } else {
                    state.cards[card.id] = card
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            for (const block of action.payload.blocks) {
                if (block.type === 'card' && block.fields.isTemplate) {
                    state.templates[block.id] = block as Card
                } else if (block.type === 'card' && !block.fields.isTemplate) {
                    state.cards[block.id] = block as Card
                }
            }
        })
    },
})

export const {updateCards} = cardsSlice.actions
export const {reducer} = cardsSlice

export const getCards = (state: RootState): {[key: string]: Card} => state.cards.cards

export const getSortedCards = createSelector(
    getCards,
    (cards) => {
        return Object.values(cards).sort((a, b) => a.title.localeCompare(b.title)) as Card[]
    },
)

export const getTemplates = (state: RootState): {[key: string]: Card} => state.cards.templates

export const getSortedTemplates = createSelector(
    getTemplates,
    (templates) => {
        return Object.values(templates).sort((a, b) => a.title.localeCompare(b.title)) as Card[]
    },
)

export function getCard(cardId: string): (state: RootState) => Card|undefined {
    return (state: RootState): Card|undefined => {
        return state.cards.cards[cardId] || state.cards.templates[cardId]
    }
}

export const getCurrentBoardCards = createSelector(
    (state) => state.boards.current,
    getCards,
    (boardId, cards) => {
        return Object.values(cards).filter((c) => c.parentId === boardId) as Card[]
    },
)

export const getCurrentBoardTemplates = createSelector(
    (state) => state.boards.current,
    getTemplates,
    (boardId, cards) => {
        return Object.values(cards).filter((c) => c.parentId === boardId) as Card[]
    },
)
