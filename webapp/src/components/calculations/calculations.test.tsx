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
    card1.properties.property_5 = '1.165'

    const card2 = TestBlockFactory.createCard(board)
    card2.properties.property_2 = 'Lorem'
    card2.properties.property_3 = ''
    card2.properties.property_4 = 'Baz'
    card2.properties.property_5 = '-8.55'

    const card3 = TestBlockFactory.createCard(board)
    card3.properties.property_2 = 'Lorem'
    card3.properties.property_3 = ''
    card3.properties.property_4 = 'Baz'
    card3.properties.property_5 = '0'

    const cards = [card1, card2, card3]

    test('count', () => {
        const property = {
            id: 'property_2',
            name: '',
            type: 'text',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.count(cards, property)
        expect(result).toBe('3')
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

    test('sum', () => {
        const property = {
            id: 'property_5',
            name: '',
            type: 'number',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.sum(cards, property)
        expect(result).toBe('-7.39')
    })

    test('average', () => {
        const property = {
            id: 'property_5',
            name: '',
            type: 'number',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.average(cards, property)
        expect(result).toBe('-2.46')
    })

    test('median', () => {
        const property = {
            id: 'property_5',
            name: '',
            type: 'number',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.median(cards, property)
        expect(result).toBe('0')
    })

    test('min', () => {
        const property = {
            id: 'property_5',
            name: '',
            type: 'number',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.min(cards, property)
        expect(result).toBe('-8.55')
    })

    test('max', () => {
        const property = {
            id: 'property_5',
            name: '',
            type: 'number',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.max(cards, property)
        expect(result).toBe('1.17')
    })

    test('range', () => {
        const property = {
            id: 'property_5',
            name: '',
            type: 'number',
            options: [],
        } as IPropertyTemplate

        const result = Calculations.range(cards, property)
        expect(result).toBe('-8.55 - 1.17')
    })
})
