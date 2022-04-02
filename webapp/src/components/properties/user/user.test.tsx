// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render, waitFor} from '@testing-library/react'

import configureStore from 'redux-mock-store'

import {act} from 'react-dom/test-utils'

import userEvent from '@testing-library/user-event'

import {wrapIntl} from '../../../testUtils'

import UserProperty from './user'

describe('components/properties/user', () => {
    const mockStore = configureStore([])
    const state = {
        users: {
            boardUsers: {
                'user-id-1': {
                    id: 'user-id-1',
                    username: 'username-1',
                    email: 'user-1@example.com',
                    props: {},
                    create_at: 1621315184,
                    update_at: 1621315184,
                    delete_at: 0,
                },
            },
        },
    }

    test('not readonly not existing user', async () => {
        const store = mockStore(state)
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <UserProperty
                    value={'user-id-2'}
                    readonly={false}
                    onChange={() => {
                    }}
                />
            </ReduxProvider>,
        )

        const renderResult = render(component)
        const container = await waitFor(() => {
            if (!renderResult.container) {
                return Promise.reject(new Error('container not found'))
            }
            return Promise.resolve(renderResult.container)
        })
        expect(container).toMatchSnapshot()
    })

    test('not readonly', async () => {
        const store = mockStore(state)
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <UserProperty
                    value={'user-id-1'}
                    readonly={false}
                    onChange={() => {
                    }}
                />
            </ReduxProvider>,
        )

        const renderResult = render(component)
        const container = await waitFor(() => {
            if (!renderResult.container) {
                return Promise.reject(new Error('container not found'))
            }
            return Promise.resolve(renderResult.container)
        })
        expect(container).toMatchSnapshot()
    })

    test('readonly view', async () => {
        const store = mockStore(state)
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <UserProperty
                    value={'user-id-1'}
                    readonly={true}
                    onChange={() => {
                    }}
                />
            </ReduxProvider>,
        )

        const renderResult = render(component)
        const container = await waitFor(() => {
            if (!renderResult.container) {
                return Promise.reject(new Error('container not found'))
            }
            return Promise.resolve(renderResult.container)
        })
        expect(container).toMatchSnapshot()
    })

    test('user dropdown open', async () => {
        const store = mockStore(state)
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <UserProperty
                    value={'user-id-1'}
                    readonly={false}
                    onChange={() => {
                    }}
                />
            </ReduxProvider>,
        )

        const renderResult = render(component)
        const container = await waitFor(() => {
            if (!renderResult.container) {
                return Promise.reject(new Error('container not found'))
            }
            return Promise.resolve(renderResult.container)
        })

        if (container) {
            // this is the actual element where the click event triggers
            // opening of the dropdown
            const userProperty = container.querySelector('.UserProperty > div > div:nth-child(1) > div:nth-child(2) > input')
            expect(userProperty).not.toBeNull()

            act(() => {
                userEvent.click(userProperty as Element)
            })
            expect(container).toMatchSnapshot()
        } else {
            throw new Error('container should have been initialized')
        }
    })
})
