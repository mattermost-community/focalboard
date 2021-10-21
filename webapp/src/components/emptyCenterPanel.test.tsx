// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {render} from '@testing-library/react'

import {createMemoryHistory} from 'history'

import {Provider as ReduxProvider} from 'react-redux'

import {Router} from 'react-router-dom'

import {wrapIntl, mockStateStore} from '../testUtils'

import {Utils} from '../utils'

import EmptyCenterPanel from './emptyCenterPanel'

describe('components/emptyCenterPanel', () => {
    const store = mockStateStore([], {
        globalTemplates: {
            value: [
                {
                    id: '2',
                    title: 'GlobalTemplates1',
                    fields: {
                        icon: 'ICONNNN',
                    },
                },
            ],
        },
        boards: {
            templates: {
                abc: {
                    id: '1',
                    title: 'Templates1',
                    fields: {
                        icon: 'ICONNNN',
                    },
                },
            },
        },
        workspace: {
            current: '123',
        },
    })
    const history = createMemoryHistory()

    test('Empty Center Panel Instantiated', () => {
        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <EmptyCenterPanel/>
                </Router>
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })

    test('Empty Center Panel Instantiated with isFocalboardPlugin = True', () => {
        Utils.isFocalboardPlugin = jest.fn().mockReturnValueOnce(true)
        const {container} = render(wrapIntl(
            <ReduxProvider store={store}>
                <Router history={history}>
                    <EmptyCenterPanel/>
                </Router>
            </ReduxProvider>,
        ))
        expect(container).toMatchSnapshot()
    })
})
