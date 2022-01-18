// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {render, screen} from '@testing-library/react'

import {createMemoryHistory} from 'history'

import {Router} from 'react-router-dom'

import {Provider as ReduxProvider} from 'react-redux'

import userEvent from '@testing-library/user-event'

import configureStore from 'redux-mock-store'

import {wrapIntl} from '../../testUtils'

import WelcomePage from './welcomePage'

const w = (window as any)
const oldBaseURL = w.baseURL

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

    test('Welcome Page shows Explore Page And Then Proceeds after Clicking Explore', () => {
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
        expect(history.replace).toBeCalledWith('/dashboard')
    })

    test('Welcome Page does not render explore page the second time we visit it', () => {
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
        expect(history.replace).toBeCalledWith('/dashboard')
    })

    test('Welcome Page redirects us when we have a r query parameter with welcomePageViewed set to true', () => {
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
        expect(history.replace).toBeCalledWith('123')
    })

    test('Welcome Page redirects us when we have a r query parameter with welcomePageViewed set to null', () => {
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
        expect(history.replace).toBeCalledWith('123')
    })
})
