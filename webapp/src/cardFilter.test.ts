// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {mocked} from 'jest-mock'

import {createFilterClause} from './blocks/filterClause'

import {createFilterGroup} from './blocks/filterGroup'
import {CardFilter} from './cardFilter'
import {TestBlockFactory} from './test/testBlockFactory'
import {Utils} from './utils'
import {IPropertyTemplate} from './blocks/board'

jest.mock('./utils')
const mockedUtils = mocked(Utils, true)
describe('src/cardFilter', () => {
    const board = TestBlockFactory.createBoard()
    board.id = '1'

    const card1 = TestBlockFactory.createCard(board)
    card1.id = '1'
    card1.title = 'card1'
    card1.fields.properties.propertyId = 'Status'
    const filterClause = createFilterClause({propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status']})
    describe('verify isClauseMet method', () => {
        test('should be true with isNotEmpty clause', () => {
            const filterClauseIsNotEmpty = createFilterClause({propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status']})
            const result = CardFilter.isClauseMet(filterClauseIsNotEmpty, [], card1)
            expect(result).toBeTruthy()
        })
        test('should be false with isEmpty clause', () => {
            const filterClauseIsEmpty = createFilterClause({propertyId: 'propertyId', condition: 'isEmpty', values: ['Status']})
            const result = CardFilter.isClauseMet(filterClauseIsEmpty, [], card1)
            expect(result).toBeFalsy()
        })
        test('should be true with includes clause', () => {
            const filterClauseIncludes = createFilterClause({propertyId: 'propertyId', condition: 'includes', values: ['Status']})
            const result = CardFilter.isClauseMet(filterClauseIncludes, [], card1)
            expect(result).toBeTruthy()
        })
        test('should be true with includes and no values clauses', () => {
            const filterClauseIncludes = createFilterClause({propertyId: 'propertyId', condition: 'includes', values: []})
            const result = CardFilter.isClauseMet(filterClauseIncludes, [], card1)
            expect(result).toBeTruthy()
        })
        test('should be false with notIncludes clause', () => {
            const filterClauseNotIncludes = createFilterClause({propertyId: 'propertyId', condition: 'notIncludes', values: ['Status']})
            const result = CardFilter.isClauseMet(filterClauseNotIncludes, [], card1)
            expect(result).toBeFalsy()
        })
        test('should be true with notIncludes and no values clauses', () => {
            const filterClauseNotIncludes = createFilterClause({propertyId: 'propertyId', condition: 'notIncludes', values: []})
            const result = CardFilter.isClauseMet(filterClauseNotIncludes, [], card1)
            expect(result).toBeTruthy()
        })
    })
    describe('verify isFilterGroupMet method', () => {
        test('should return true with no filter', () => {
            const filterGroup = createFilterGroup({
                operation: 'and',
                filters: [],
            })
            const result = CardFilter.isFilterGroupMet(filterGroup, [], card1)
            expect(result).toBeTruthy()
        })
        test('should return true with or operation and 2 filterCause, one is false ', () => {
            const filterClauseNotIncludes = createFilterClause({propertyId: 'propertyId', condition: 'notIncludes', values: ['Status']})
            const filterGroup = createFilterGroup({
                operation: 'or',
                filters: [
                    filterClauseNotIncludes,
                    filterClause,
                ],
            })
            const result = CardFilter.isFilterGroupMet(filterGroup, [], card1)
            expect(result).toBeTruthy()
        })
        test('should return true with or operation and 2 filterCause, 1 filtergroup in filtergroup, one filterClause is false ', () => {
            const filterClauseNotIncludes = createFilterClause({propertyId: 'propertyId', condition: 'notIncludes', values: ['Status']})
            const filterGroupInFilterGroup = createFilterGroup({
                operation: 'or',
                filters: [
                    filterClauseNotIncludes,
                    filterClause,
                ],
            })
            const filterGroup = createFilterGroup({
                operation: 'or',
                filters: [],
            })
            filterGroup.filters.push(filterGroupInFilterGroup)
            const result = CardFilter.isFilterGroupMet(filterGroup, [], card1)
            expect(result).toBeTruthy()
        })
        test('should return false with or operation and two filterCause, two are false ', () => {
            const filterClauseNotIncludes = createFilterClause({propertyId: 'propertyId', condition: 'notIncludes', values: ['Status']})
            const filterClauseEmpty = createFilterClause({propertyId: 'propertyId', condition: 'isEmpty', values: ['Status']})
            const filterGroup = createFilterGroup({
                operation: 'or',
                filters: [
                    filterClauseNotIncludes,
                    filterClauseEmpty,
                ],
            })
            const result = CardFilter.isFilterGroupMet(filterGroup, [], card1)
            expect(result).toBeFalsy()
        })
        test('should return false with and operation and 2 filterCause, one is false ', () => {
            const filterClauseNotIncludes = createFilterClause({propertyId: 'propertyId', condition: 'notIncludes', values: ['Status']})
            const filterGroup = createFilterGroup({
                operation: 'and',
                filters: [
                    filterClauseNotIncludes,
                    filterClause,
                ],
            })
            const result = CardFilter.isFilterGroupMet(filterGroup, [], card1)
            expect(result).toBeFalsy()
        })
        test('should return true with and operation and 2 filterCause, two are true ', () => {
            const filterClauseIncludes = createFilterClause({propertyId: 'propertyId', condition: 'includes', values: ['Status']})
            const filterGroup = createFilterGroup({
                operation: 'and',
                filters: [
                    filterClauseIncludes,
                    filterClause,
                ],
            })
            const result = CardFilter.isFilterGroupMet(filterGroup, [], card1)
            expect(result).toBeTruthy()
        })
        test('should return true with or operation and 2 filterCause, 1 filtergroup in filtergroup, one filterClause is false ', () => {
            const filterClauseNotIncludes = createFilterClause({propertyId: 'propertyId', condition: 'notIncludes', values: ['Status']})
            const filterGroupInFilterGroup = createFilterGroup({
                operation: 'and',
                filters: [
                    filterClauseNotIncludes,
                    filterClause,
                ],
            })
            const filterGroup = createFilterGroup({
                operation: 'and',
                filters: [],
            })
            filterGroup.filters.push(filterGroupInFilterGroup)
            const result = CardFilter.isFilterGroupMet(filterGroup, [], card1)
            expect(result).toBeFalsy()
        })
    })
    describe('verify propertyThatMeetsFilterClause method', () => {
        test('should return Utils.assertFailure and filterClause propertyId ', () => {
            const filterClauseIsNotEmpty = createFilterClause({propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status']})
            const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [])
            expect(mockedUtils.assertFailure).toBeCalledTimes(1)
            expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId)
        })
        test('should return filterClause propertyId with non-select template and isNotEmpty clause ', () => {
            const filterClauseIsNotEmpty = createFilterClause({propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status']})
            const templateFilter: IPropertyTemplate = {
                id: filterClauseIsNotEmpty.propertyId,
                name: 'template',
                type: 'text',
                options: [],
            }
            const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [templateFilter])
            expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId)
            expect(result.value).toBeFalsy()
        })
        test('should return filterClause propertyId with select template , an option and isNotEmpty clause ', () => {
            const filterClauseIsNotEmpty = createFilterClause({propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status']})
            const templateFilter: IPropertyTemplate = {
                id: filterClauseIsNotEmpty.propertyId,
                name: 'template',
                type: 'select',
                options: [{
                    id: 'idOption',
                    value: '',
                    color: '',
                }],
            }
            const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [templateFilter])
            expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId)
            expect(result.value).toEqual('idOption')
        })
        test('should return filterClause propertyId with select template , no option and isNotEmpty clause ', () => {
            const filterClauseIsNotEmpty = createFilterClause({propertyId: 'propertyId', condition: 'isNotEmpty', values: ['Status']})
            const templateFilter: IPropertyTemplate = {
                id: filterClauseIsNotEmpty.propertyId,
                name: 'template',
                type: 'select',
                options: [],
            }
            const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsNotEmpty, [templateFilter])
            expect(result.id).toEqual(filterClauseIsNotEmpty.propertyId)
            expect(result.value).toBeFalsy()
        })

        test('should return filterClause propertyId with template, and includes clause with values', () => {
            const filterClauseIncludes = createFilterClause({propertyId: 'propertyId', condition: 'includes', values: ['Status']})
            const templateFilter: IPropertyTemplate = {
                id: filterClauseIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: [],
            }
            const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIncludes, [templateFilter])
            expect(result.id).toEqual(filterClauseIncludes.propertyId)
            expect(result.value).toEqual(filterClauseIncludes.values[0])
        })
        test('should return filterClause propertyId with template, and includes clause with no values', () => {
            const filterClauseIncludes = createFilterClause({propertyId: 'propertyId', condition: 'includes', values: []})
            const templateFilter: IPropertyTemplate = {
                id: filterClauseIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: [],
            }
            const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIncludes, [templateFilter])
            expect(result.id).toEqual(filterClauseIncludes.propertyId)
            expect(result.value).toBeFalsy()
        })
        test('should return filterClause propertyId with template, and notIncludes clause', () => {
            const filterClauseNotIncludes = createFilterClause({propertyId: 'propertyId', condition: 'notIncludes', values: []})
            const templateFilter: IPropertyTemplate = {
                id: filterClauseNotIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: [],
            }
            const result = CardFilter.propertyThatMeetsFilterClause(filterClauseNotIncludes, [templateFilter])
            expect(result.id).toEqual(filterClauseNotIncludes.propertyId)
            expect(result.value).toBeFalsy()
        })
        test('should return filterClause propertyId with template, and isEmpty clause', () => {
            const filterClauseIsEmpty = createFilterClause({propertyId: 'propertyId', condition: 'isEmpty', values: []})
            const templateFilter: IPropertyTemplate = {
                id: filterClauseIsEmpty.propertyId,
                name: 'template',
                type: 'text',
                options: [],
            }
            const result = CardFilter.propertyThatMeetsFilterClause(filterClauseIsEmpty, [templateFilter])
            expect(result.id).toEqual(filterClauseIsEmpty.propertyId)
            expect(result.value).toBeFalsy()
        })
    })
    describe('verify propertiesThatMeetFilterGroup method', () => {
        test('should return {} with undefined filterGroup', () => {
            const result = CardFilter.propertiesThatMeetFilterGroup(undefined, [])
            expect(result).toEqual({})
        })
        test('should return {} with filterGroup without filter', () => {
            const filterGroup = createFilterGroup({
                operation: 'and',
                filters: [],
            })
            const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, [])
            expect(result).toEqual({})
        })
        test('should return {} with filterGroup, or operation and no template', () => {
            const filterClauseIncludes = createFilterClause({propertyId: 'propertyId', condition: 'includes', values: ['Status']})
            const filterGroup = createFilterGroup({
                operation: 'or',
                filters: [
                    filterClauseIncludes,
                    filterClause,
                ],
            })
            const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, [])
            expect(result).toEqual({})
        })
        test('should return a result with filterGroup, or operation and template', () => {
            const filterClauseIncludes = createFilterClause({propertyId: 'propertyId', condition: 'includes', values: ['Status']})
            const filterGroup = createFilterGroup({
                operation: 'or',
                filters: [
                    filterClauseIncludes,
                    filterClause,
                ],
            })
            const templateFilter: IPropertyTemplate = {
                id: filterClauseIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: [],
            }
            const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, [templateFilter])
            expect(result).toBeDefined()
            expect(result.propertyId).toEqual(filterClauseIncludes.values[0])
        })
        test('should return {} with filterGroup, and operation and no template', () => {
            const filterClauseIncludes = createFilterClause({propertyId: 'propertyId', condition: 'includes', values: ['Status']})
            const filterGroup = createFilterGroup({
                operation: 'and',
                filters: [
                    filterClauseIncludes,
                    filterClause,
                ],
            })
            const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, [])
            expect(result).toEqual({})
        })

        test('should return a result with filterGroup, and operation and template', () => {
            const filterClauseIncludes = createFilterClause({propertyId: 'propertyId', condition: 'includes', values: ['Status']})
            const filterGroup = createFilterGroup({
                operation: 'and',
                filters: [
                    filterClauseIncludes,
                    filterClause,
                ],
            })
            const templateFilter: IPropertyTemplate = {
                id: filterClauseIncludes.propertyId,
                name: 'template',
                type: 'text',
                options: [],
            }
            const result = CardFilter.propertiesThatMeetFilterGroup(filterGroup, [templateFilter])
            expect(result).toBeDefined()
            expect(result.propertyId).toEqual(filterClauseIncludes.values[0])
        })
    })
    describe('verify applyFilterGroup method', () => {
        test('should return array with card1', () => {
            const filterClauseNotIncludes = createFilterClause({propertyId: 'propertyId', condition: 'notIncludes', values: ['Status']})
            const filterGroup = createFilterGroup({
                operation: 'or',
                filters: [
                    filterClauseNotIncludes,
                    filterClause,
                ],
            })
            const result = CardFilter.applyFilterGroup(filterGroup, [], [card1])
            expect(result).toBeDefined()
            expect(result[0]).toEqual(card1)
        })
    })
})
