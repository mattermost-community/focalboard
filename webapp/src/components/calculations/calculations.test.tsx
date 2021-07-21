// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {TestBlockFactory} from '../../test/testBlockFactory'

import {IPropertyTemplate} from '../../blocks/board'

import Calculations from './calculations'

describe('components/calculations/calculation logic', () => {
    const board = TestBlockFactory.createBoard()

    const card1 = TestBlockFactory.createCard(board)
    card1.properties.property_2 = 'Foo'
    card1.properties.property_3 = 'Bar'
    card1.properties.property_4 = 'Baz'

    const card2 = TestBlockFactory.createCard(board)
    card2.properties.property_2 = 'Lorem'
    card2.properties.property_3 = ''
    card2.properties.property_4 = 'Baz'

    const cards = [card1, card2]

    test('count', () => {
        const property = {
            id: 'property_2',
            name: '',
            type: 'text',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.count(cards, property)
        expect(result).toBe('2')
    })

    test('countValue', () => {
        const property = {
            id: 'property_3',
            name: '',
            type: 'text',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.countValue(cards, property)
        expect(result).toBe('1')
    })

    test('countUniqueValue', () => {
        const property = {
            id: 'property_4',
            name: '',
            type: 'text',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.countUniqueValue(cards, property)
        expect(result).toBe('1')
    })
})
