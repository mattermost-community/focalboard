// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {render, screen, waitFor} from '@testing-library/react'

import {createMemoryHistory} from 'history'

import {Router} from 'react-router-dom'

import {Provider as ReduxProvider} from 'react-redux'

import userEvent from '@testing-library/user-event'

import configureStore from 'redux-mock-store'

import {mocked} from 'ts-jest/utils'

import {wrapIntl} from '../../testUtils'

import mutator from '../../mutator'

import WelcomePage from './welcomePage'

const w = (window as any)
const oldBaseURL = w.baseURL

jest.mock('../../mutator')
const mockedMutator = mocked(mutator, true)

beforeEach(() => {
    jest.resetAllMocks()
    mockedMutator.patchUserConfig.mockImplementation(() => Promise.resolve({
        welcomePageViewed: 'true',
    }))
})

afterEach(() => {
    w.baseURL = oldBaseURL
})

describe('pages/welcome', () => {
    const history = createMemoryHistory()
    const mockStore = configureStore([])
    const store = mockStore({
        users: {
            me: {
                props: {},
            },
        },
    })

    test('Welcome Page shows Explore Page', () => {
        const component = (
            <ReduxProvider store={store}>
                {
                    wrapIntl(
                        <Router history={history}>
                            <WelcomePage/>
                        </Router>,
                    )
                }
            </ReduxProvider>
        )

        const {container} = render(component)
        expect(screen.getByText('Take a tour')).toBeDefined()
        expect(container).toMatchSnapshot()
    })

    test('Welcome Page shows Explore Page with subpath', () => {
        w.baseURL = '/subpath'
        const component = (
            <ReduxProvider store={store}>
                {
                    wrapIntl(
                        <Router history={history}>
                            <WelcomePage/>
                        </Router>,
                    )
                }
            </ReduxProvider>
        )

        const {container} = render(component)
        expect(screen.getByText('Take a tour')).toBeDefined()
        expect(container).toMatchSnapshot()
    })

    test('Welcome Page shows Explore Page And Then Proceeds after Clicking Explore', async () => {
        history.replace = jest.fn()

        const component = (
            <ReduxProvider store={store}>
                {
                    wrapIntl(
                        <Router history={history}>
                            <WelcomePage/>
                        </Router>,
                    )
                }
            </ReduxProvider>
        )

        render(component)
        const exploreButton = screen.getByText('Take a tour')
        expect(exploreButton).toBeDefined()
        userEvent.click(exploreButton)
        await waitFor(() => {
            expect(history.replace).toBeCalledWith('/dashboard')
            expect(mockedMutator.patchUserConfig).toBeCalledTimes(1)
        })
    })

    test('Welcome Page does not render explore page the second time we visit it', async () => {
        history.replace = jest.fn()

        const customStore = mockStore({
            users: {
                me: {
                    props: {
                        welcomePageViewed: 'true',
                    },
                },
            },
        })

        const component = (
            <ReduxProvider store={customStore}>
                {
                    wrapIntl(
                        <Router history={history}>
                            <WelcomePage/>
                        </Router>,
                    )
                }
            </ReduxProvider>
        )

        render(component)
        await waitFor(() => {
            expect(history.replace).toBeCalledWith('/dashboard')
        })
    })

    test('Welcome Page redirects us when we have a r query parameter with welcomePageViewed set to true', async () => {
        history.replace = jest.fn()
        history.location.search = 'r=123'

        const customStore = mockStore({
            users: {
                me: {
                    props: {
                        welcomePageViewed: 'true',
                    },
                },
            },
        })
        const component = (
            <ReduxProvider store={customStore}>
                {
                    wrapIntl(
                        <Router history={history}>
                            <WelcomePage/>
                        </Router>,
                    )
                }
            </ReduxProvider>
        )

        render(component)
        await waitFor(() => {
            expect(history.replace).toBeCalledWith('123')
        })
    })

    test('Welcome Page redirects us when we have a r query parameter with welcomePageViewed set to null', async () => {
        history.replace = jest.fn()
        history.location.search = 'r=123'
        const component = (
            <ReduxProvider store={store}>
                {
                    wrapIntl(
                        <Router history={history}>
                            <WelcomePage/>
                        </Router>,
                    )
                }
            </ReduxProvider>
        )
        render(component)
        const exploreButton = screen.getByText('Take a tour')
        expect(exploreButton).toBeDefined()
        userEvent.click(exploreButton)
        await waitFor(() => {
            expect(history.replace).toBeCalledWith('123')
            expect(mockedMutator.patchUserConfig).toBeCalledTimes(1)
        })
    })
})
