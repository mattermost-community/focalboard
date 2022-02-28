// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {render, within, act, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {wrapDNDIntl} from '../../testUtils'

import BoardTemplateSelectorItem from './boardTemplateSelectorItem'

jest.mock('react-router-dom', () => {
    const originalModule = jest.requireActual('react-router-dom')

    return {
        ...originalModule,
        useRouteMatch: jest.fn(() => {
            return {url: '/'}
        }),
    }
})

const groupProperty: IPropertyTemplate = {
    id: 'group-prop-id',
    name: 'name',
    type: 'text',
    options: [
        {
            color: 'propColorOrange',
            id: 'property_value_id_1',
            value: 'Q1',
        },
        {
            color: 'propColorBlue',
            id: 'property_value_id_2',
            value: 'Q2',
        },
    ],
}

jest.mock('../../octoClient', () => {
    return {
        getSubtree: jest.fn(() => Promise.resolve([
            {
                id: '1',
                teamId: 'team',
                title: 'Template',
                icon: '🚴🏻‍♂️',
                cardProperties: [groupProperty],
                dateDisplayPropertyId: 'id-5',
            },
            {
                id: '2',
                boardId: '1',
                title: 'View',
                type: 'view',
                fields: {
                    groupById: 'group-prop-id',
                    viewType: 'board',
                    visibleOptionIds: ['group-prop-id'],
                    hiddenOptionIds: [],
                    visiblePropertyIds: ['group-prop-id'],
                    sortOptions: [],
                    kanbanCalculations: {},
                },
            },
            {
                id: '3',
                boardId: '1',
                title: 'Card',
                type: 'card',
                fields: {
                    icon: '🚴🏻‍♂️',
                    properties: {
                        'group-prop-id': 'test',
                    },
                },
            },
        ])),
    }
})
jest.mock('../../utils')
jest.mock('../../mutator')

describe('components/boardTemplateSelector/boardTemplateSelectorItem', () => {
    const template: Board = {
        id: '1',
        teamId: 'team-1',
        title: 'Template 1',
        createdBy: 'user-1',
        modifiedBy: 'user-1',
        createAt: 10,
        updateAt: 20,
        deleteAt: 0,
        description: 'test',
        showDescription: false,
        type: 'board',
        isTemplate: true,
        templateVersion: 0,
        icon: '🚴🏻‍♂️',
        cardProperties: [groupProperty],
        columnCalculations: {},
        properties: {},
    }

    const globalTemplate: Board = {
        id: 'global-1',
        title: 'Template global',
        teamId: '0',
        createdBy: 'user-1',
        modifiedBy: 'user-1',
        createAt: 10,
        updateAt: 20,
        deleteAt: 0,
        type: 'board',
        icon: '🚴🏻‍♂️',
        description: 'test',
        showDescription: false,
        cardProperties: [groupProperty],
        columnCalculations: {},
        isTemplate: true,
        templateVersion: 2,
        properties: {},
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should match snapshot', async () => {
        const {container} = render(wrapDNDIntl(
            <BoardTemplateSelectorItem
                isActive={false}
                template={template}
                onSelect={jest.fn()}
                onDelete={jest.fn()}
                onEdit={jest.fn()}
            />
            ,
        ))
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot when active', async () => {
        const {container} = render(wrapDNDIntl(
            <BoardTemplateSelectorItem
                isActive={true}
                template={template}
                onSelect={jest.fn()}
                onDelete={jest.fn()}
                onEdit={jest.fn()}
            />
            ,
        ))
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with global template', async () => {
        const {container} = render(wrapDNDIntl(
            <BoardTemplateSelectorItem
                isActive={false}
                template={globalTemplate}
                onSelect={jest.fn()}
                onDelete={jest.fn()}
                onEdit={jest.fn()}
            />
            ,
        ))
        expect(container).toMatchSnapshot()
    })

    test('should trigger the onSelect (and not any other) when click the element', async () => {
        const onSelect = jest.fn()
        const onDelete = jest.fn()
        const onEdit = jest.fn()
        const {container} = render(wrapDNDIntl(
            <BoardTemplateSelectorItem
                isActive={false}
                template={template}
                onSelect={onSelect}
                onDelete={onDelete}
                onEdit={onEdit}
            />
            ,
        ))
        userEvent.click(container.querySelector('.BoardTemplateSelectorItem')!)
        expect(onSelect).toBeCalledTimes(1)
        expect(onSelect).toBeCalledWith(template)
        expect(onDelete).not.toBeCalled()
        expect(onEdit).not.toBeCalled()
    })

    test('should trigger the onDelete (and not any other) when click the delete icon', async () => {
        const onSelect = jest.fn()
        const onDelete = jest.fn()
        const onEdit = jest.fn()
        const {container} = render(wrapDNDIntl(
            <BoardTemplateSelectorItem
                isActive={false}
                template={template}
                onSelect={onSelect}
                onDelete={onDelete}
                onEdit={onEdit}
            />
            ,
        ))
        userEvent.click(container.querySelector('.BoardTemplateSelectorItem .EditIcon')!)
        expect(onEdit).toBeCalledTimes(1)
        expect(onEdit).toBeCalledWith(template.id)
        expect(onSelect).not.toBeCalled()
        expect(onDelete).not.toBeCalled()
    })

    test('should trigger the onDelete (and not any other) when click the delete icon and confirm', async () => {
        const onSelect = jest.fn()
        const onDelete = jest.fn()
        const onEdit = jest.fn()

        const root = document.createElement('div')
        root.setAttribute('id', 'focalboard-root-portal')
        render(wrapDNDIntl(
            <BoardTemplateSelectorItem
                isActive={false}
                template={template}
                onSelect={onSelect}
                onDelete={onDelete}
                onEdit={onEdit}
            />
            ,
        ), {container: document.body.appendChild(root)})
        act(() => {
            userEvent.click(root.querySelector('.BoardTemplateSelectorItem .DeleteIcon')!)
        })

        expect(root).toMatchSnapshot()

        const {getByText} = within(root)
        act(() => {
            userEvent.click(getByText('Delete')!)
        })

        await waitFor(async () => expect(onDelete).toBeCalledTimes(1))
        await waitFor(async () => expect(onDelete).toBeCalledWith(template))
        await waitFor(async () => expect(onSelect).not.toBeCalled())
        await waitFor(async () => expect(onEdit).not.toBeCalled())
    })
})
