// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Provider as ReduxProvider} from 'react-redux'

import {render} from '@testing-library/react'

import {IntlProvider} from 'react-intl'

import userEvent from '@testing-library/user-event'
import configureStore from 'redux-mock-store'

import {defaultThemeName} from '../../theme'

import SidebarSettingsMenu from './sidebarSettingsMenu'

const wrapIntl = (children: any) => <IntlProvider locale='en'>{children}</IntlProvider>

describe('components/sidebar/SidebarSettingsMenu', () => {
    const mockStore = configureStore([])
    let store = mockStore({})
    beforeEach(() => {
        store = mockStore({})
    })
    test('settings menu closed should match snapshot', () => {
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <SidebarSettingsMenu
                    setWhiteLogo={() => {}}
                    activeTheme={defaultThemeName}
                />
            </ReduxProvider>,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('settings menu open should match snapshot', () => {
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <SidebarSettingsMenu
                    setWhiteLogo={() => {}}
                    activeTheme={defaultThemeName}
                />
            </ReduxProvider>,
        )

        const {container} = render(component)
        userEvent.click(container.querySelector('.menu-entry') as Element)
        expect(container).toMatchSnapshot()
    })

    test('theme menu open should match snapshot', () => {
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <SidebarSettingsMenu
                    setWhiteLogo={() => {}}
                    activeTheme={defaultThemeName}
                />
            </ReduxProvider>,
        )

        const {container} = render(component)
        userEvent.click(container.querySelector('.menu-entry') as Element)
        userEvent.click(container.querySelector('#theme') as Element)
        expect(container).toMatchSnapshot()
    })

    test('languages menu open should match snapshot', () => {
        const component = wrapIntl(
            <ReduxProvider store={store}>
                <SidebarSettingsMenu
                    setWhiteLogo={() => {}}
                    activeTheme={defaultThemeName}
                />
            </ReduxProvider>,
        )

        const {container} = render(component)
        userEvent.click(container.querySelector('.menu-entry') as Element)
        userEvent.click(container.querySelector('#lang') as Element)
        expect(container).toMatchSnapshot()
    })
})
