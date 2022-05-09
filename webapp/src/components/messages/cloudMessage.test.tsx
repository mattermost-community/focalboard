// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render, screen} from '@testing-library/react'
import {mocked} from 'jest-mock'
import userEvent from '@testing-library/user-event'

import configureStore from 'redux-mock-store'

import {Utils} from '../../utils'

import {IUser} from '../../user'

import {wrapIntl} from '../../testUtils'

import client from '../../octoClient'

import CloudMessage from './cloudMessage'

jest.mock('../../utils')
jest.mock('../../octoClient')
const mockedOctoClient = mocked(client, true)

describe('components/messages/CloudMessage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const mockedUtils = mocked(Utils, true)
    const mockStore = configureStore([])

    test('plugin mode, no display', () => {
        mockedUtils.isFocalboardPlugin.mockReturnValue(true)

        const me: IUser = {
            id: 'user-id-1',
            username: 'username_1',
            email: '',
            props: {},
            create_at: 0,
            update_at: 0,
            is_bot: false,
        }
        const state = {
            users: {
                me,
            },
        }

        const store = mockStore(state)

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <CloudMessage/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('not plugin mode, close message', () => {
        const me: IUser = {
            id: 'user-id-1',
            username: 'username_1',
            email: '',
            props: {
                focalboard_cloudMessageCanceled: 'true',
            },
            create_at: 0,
            update_at: 0,
            is_bot: false,
        }
        const state = {
            users: {
                me,
            },
        }
        const store = mockStore(state)
        mockedUtils.isFocalboardPlugin.mockReturnValue(false)

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <CloudMessage/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('not plugin mode, show message, close message', () => {
        const me: IUser = {
            id: 'user-id-1',
            username: 'username_1',
            email: '',
            props: {},
            create_at: 0,
            update_at: 0,
            is_bot: false,
        }
        const state = {
            users: {
                me,
            },
        }
        const store = mockStore(state)
        mockedUtils.isFocalboardPlugin.mockReturnValue(false)

        const component = wrapIntl(
            <ReduxProvider store={store}>
                <CloudMessage/>
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()

        const buttonElement = screen.getByRole('button', {name: 'Close dialog'})
        userEvent.click(buttonElement)
        expect(mockedOctoClient.patchUserConfig).toBeCalledWith('user-id-1', {
            updatedFields: {
                focalboard_cloudMessageCanceled: 'true',
            },
        })
    })
})
