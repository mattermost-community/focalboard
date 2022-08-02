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

import {UserSettings} from '../../userSettings'

import {getMe, patchProps, getVersionMessageCanceled, versionProperty} from '../../store/users'

import VersionMessage from './versionMessage'


jest.mock('../../utils')
jest.mock('../../octoClient')
const mockedOctoClient = mocked(client, true)

describe('components/messages/VersionMessage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    // const mockedUtils = mocked(Utils, true)
    const mockStore = configureStore([])

    if (versionProperty){
        test('single user mode, no display', () => {    
            const me: IUser = {
                id: 'single-user',
                username: 'username_1',
                email: '',
                nickname: '',
                firstname: '', 
                lastname: '',
                props: {},
                create_at: 0,
                update_at: 0,
                is_bot: false,
                roles: 'system_user',
            }
            const state = {
                users: {
                    me,
                },
            }
    
            const store = mockStore(state)
    
            const component = wrapIntl(
                <ReduxProvider store={store}>
                    <VersionMessage/>
                </ReduxProvider>,
            )
    
            const {container} = render(component)
            // expect(container).toMatchSnapshot()
            expect(container.firstChild).toBeNull()
            // const buttonElement = screen.getByRole('button', {name: 'Close dialog'})
            // expect(buttonElement).toBeDefined()
        })
        test('plugin mode, close message', () => {
            const me: IUser = {
                id: 'user-id-1',
                username: 'username_1',
                email: '',
                nickname: '',
                firstname: '', 
                lastname: '',
                props: {
                    [versionProperty]: 'true',
                },
                create_at: 0,
                update_at: 0,
                is_bot: false,
                roles: 'system_user',
            }
            const state = {
                users: {
                    me,
                },
            }
            const store = mockStore(state)
    
            const component = wrapIntl(
                <ReduxProvider store={store}>
                    <VersionMessage/>
                </ReduxProvider>,
            )
    
            const {container} = render(component)
            expect(container.firstChild).toBeNull()
        })
    
        test('plugin mode, show message, close message', () => {
            const me: IUser = {
                id: 'user-id-1',
                username: 'username_1',
                email: '',
                nickname: '',
                firstname: '', 
                lastname: '',
                props: {},
                create_at: 0,
                update_at: 0,
                is_bot: false,
                roles: 'system_user',
            }
            const state = {
                users: {
                    me,
                },
            }
            const store = mockStore(state)
    
            const component = wrapIntl(
                <ReduxProvider store={store}>
                    <VersionMessage/>
                </ReduxProvider>,
            )
    
            // const {container} = render(component)
            // expect(container).toMatchSnapshot()
    
            render(component)
            const buttonElement = screen.getByRole('button', {name: 'Close dialog'})
            userEvent.click(buttonElement)
            expect(mockedOctoClient.patchUserConfig).toBeCalledWith('user-id-1', {
                updatedFields: {
                    [versionProperty]: 'true',
                },
            })
        })
    
        test('not plugin mode, single user, close message', () => {
            const me: IUser = {
                id: 'single-user',
                username: 'single-user',
                email: 'single-user',
                nickname: '',
                firstname: '', 
                lastname: '',
                props: {},
                create_at: 0,
                update_at: Date.now() - (1000 * 60 * 60 * 24), //24 hours,
                is_bot: false,
                roles: 'system_user',
            }
            const state = {
                users: {
                    me,
                },
            }
            const store = mockStore(state)
            const component = wrapIntl(
                <ReduxProvider store={store}>
                    <VersionMessage/>
                </ReduxProvider>,
            )
    
            const {container} = render(component)
            expect(container.firstChild).toBeNull()
        })
    } else {
        test('no version, does not display', () => {
            const me: IUser = {
                id: 'user-id-1',
                username: 'username_1',
                email: '',
                nickname: '',
                firstname: '', 
                lastname: '',
                props: {
                },
                create_at: 0,
                update_at: 0,
                is_bot: false,
                roles: 'system_user',
            }
            const state = {
                users: {
                    me,
                },
            }
            const store = mockStore(state)
    
            const component = wrapIntl(
                <ReduxProvider store={store}>
                    <VersionMessage/>
                </ReduxProvider>,
            )
    
            const {container} = render(component)
            expect(container.firstChild).toBeNull()
        })

    }
})
