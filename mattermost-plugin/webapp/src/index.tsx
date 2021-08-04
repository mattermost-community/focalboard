// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {Store, Action} from 'redux'
import {Provider as ReduxProvider} from 'react-redux'
import {useHistory} from 'react-router-dom'

import {GlobalState} from 'mattermost-redux/types/store'

const windowAny = (window as any)
windowAny.baseURL = '/plugins/focalboard'
windowAny.frontendBaseURL = '/boards'
windowAny.isFocalboardPlugin = true

import App from '../../../webapp/src/app'
import store from '../../../webapp/src/store'
import GlobalHeader from '../../../webapp/src/components/globalHeader/globalHeader'
import FocalboardIcon from '../../../webapp/src/widgets/icons/logo'

import '../../../webapp/src/styles/variables.scss'
import '../../../webapp/src/styles/main.scss'
import '../../../webapp/src/styles/labels.scss'

import manifest from './manifest'
import ErrorBoundary from './error_boundary'

// eslint-disable-next-line import/no-unresolved
import {PluginRegistry} from './types/mattermost-webapp'

const GlobalHeaderIcon = () => {
    return (
        <svg
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
        >
            <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M6 3C4.34315 3 3 4.34314 3 6V13.2C3 14.8569 4.34314 16.2 6 16.2H7.8V18C7.8 19.6569 9.14314 21 10.8 21H18C19.6569 21 21 19.6569 21 18V10.8C21 9.14315 19.6569 7.8 18 7.8H16.2V6C16.2 4.34315 14.8569 3 13.2 3H6ZM16.2 7.8H10.8C9.14315 7.8 7.8 9.14314 7.8 10.8V16.2H13.2C14.8569 16.2 16.2 14.8569 16.2 13.2V7.8Z'
                fill='orange'
            />
        </svg>

    )
}

const MainApp = () => {
    useEffect(() => {
        document.body.classList.add('focalboard-body')
        const root = document.getElementById('root')
        if (root) {
            root.classList.add('focalboard-plugin-root')
        }

        return () => {
            document.body.classList.remove('focalboard-body')
            if (root) {
                root.classList.remove('focalboard-plugin-root')
            }
        }
    }, [])

    return (
        <ErrorBoundary>
            <ReduxProvider store={store}>
                <div id='focalboard-app'>
                    <App/>
                </div>
                <div id='focalboard-root-portal'/>
            </ReduxProvider>
        </ErrorBoundary>
    )
}

const HeaderComponent = () => {
    return (
        <ErrorBoundary>
            <GlobalHeader/>
        </ErrorBoundary>
    )
}


export default class Plugin {
    channelHeaderButtonId?: string
    registry?: PluginRegistry

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public async initialize(registry: PluginRegistry, store: Store<GlobalState, Action<Record<string, unknown>>>) {
        this.registry = registry
        const goToFocalboardWorkspace = () => {
            const currentChannel = store.getState().entities.channels.currentChannelId
            window.open(`${window.location.origin}/boards/workspace/${currentChannel}`)
        }
        this.channelHeaderButtonId = registry.registerChannelHeaderButtonAction(<FocalboardIcon/>, goToFocalboardWorkspace, '', 'Focalboard Workspace')

        this.registry.registerCustomRoute('go-to-current-workspace', () => {
            const history = useHistory()
            const currentChannel = store.getState().entities.channels.currentChannelId
            history.push(`/boards/workspace/${currentChannel}`)
            return <></>
        })

        if (this.registry.registerProduct) {
            this.registry.registerProduct('/boards', FocalboardIcon, 'Boards', '/plug/focalboard/go-to-current-workspace', MainApp, HeaderComponent)
        }
    }

    public uninitialize() {
        if (this.channelHeaderButtonId) {
            this.registry?.unregisterComponent(this.channelHeaderButtonId)
        }
    }
}

declare global {
    interface Window {
        registerPlugin(id: string, plugin: Plugin): void
    }
}

window.registerPlugin(manifest.id, new Plugin())
