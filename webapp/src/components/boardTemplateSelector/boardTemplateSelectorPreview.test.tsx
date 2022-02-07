// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {render, waitFor} from '@testing-library/react'
import React from 'react'
import {MockStoreEnhanced} from 'redux-mock-store'

import {Provider as ReduxProvider} from 'react-redux'

import {UserWorkspace} from '../../user'
import {IPropertyTemplate} from '../../blocks/board'
import {mockDOM, mockStateStore, wrapDNDIntl} from '../../testUtils'

import BoardTemplateSelectorPreview from './boardTemplateSelectorPreview'

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
                workspaceId: 'workspace',
                title: 'Template',
                type: 'board',
                fields: {
                    icon: '🚴🏻‍♂️',
                    cardProperties: [groupProperty],
                    dateDisplayPropertyId: 'id-5',
                },
            },
            {
                id: '2',
                workspaceId: 'workspace',
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
                workspaceId: 'workspace',
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

describe('components/boardTemplateSelector/boardTemplateSelectorPreview', () => {
    const workspace1: UserWorkspace = {
        id: 'workspace_1',
        title: 'Workspace 1',
        boardCount: 1,
    }
    const template1Title = 'Template 1'
    const globalTemplateTitle = 'Template Global'
    const boardTitle = 'Board 1'
    let store:MockStoreEnhanced<unknown, unknown>
    beforeAll(mockDOM)
    beforeEach(() => {
        jest.clearAllMocks()
        const state = {
            searchText: {value: ''},
            users: {me: {id: 'user-id'}},
            cards: {templates: []},
            views: {views: []},
            contents: {contents: []},
            comments: {comments: []},
            workspace: {
                userWorkspaces: new Array<UserWorkspace>(workspace1),
                current: workspace1,
            },
            boards: {
                boards: [
                    {
                        id: '2',
                        title: boardTitle,
                        workspaceId: workspace1.id,
                        fields: {
                            icon: '🚴🏻‍♂️',
                            cardProperties: [groupProperty],
                            dateDisplayPropertyId: 'id-6',
                        },
                    },
                ],
                templates: [
                    {
                        id: '1',
                        workspaceId: workspace1.id,
                        title: template1Title,
                        fields: {
                            icon: '🚴🏻‍♂️',
                            cardProperties: [groupProperty],
                            dateDisplayPropertyId: 'id-5',
                        },
                    },
                ],
                cards: [],
                views: [],
            },
            globalTemplates: {
                value: [{
                    id: 'global-1',
                    title: globalTemplateTitle,
                    workspaceId: '0',
                    fields: {
                        icon: '🚴🏻‍♂️',
                        cardProperties: [
                            {id: 'global-id-5'},
                        ],
                        dateDisplayPropertyId: 'global-id-5',
                    },
                }],
            },
        }
        store = mockStateStore([], state)
    })

    test('should match snapshot', async () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <BoardTemplateSelectorPreview activeTemplate={(store.getState() as any).boards.templates[0]}/>
            </ReduxProvider>
            ,
        ))
        await waitFor(() => expect(container.querySelector('.top-head')).not.toBeNull())
        expect(container).toMatchSnapshot()
    })
    test('should be null without activeTemplate', () => {
        const {container} = render(wrapDNDIntl(
            <ReduxProvider store={store}>
                <BoardTemplateSelectorPreview activeTemplate={null}/>
            </ReduxProvider>
            ,
        ))
        expect(container).toMatchSnapshot()
    })
})
