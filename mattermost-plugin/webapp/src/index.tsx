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

import './plugin.scss'

const GlobalHeaderIcon = () => {
    return (
        <span style={{height: 24, width: 24, display: 'inline-block'}}>
            <FocalboardIcon/>
        </span>
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
            this.registry.registerProduct('/boards', GlobalHeaderIcon, 'Boards', '/plug/focalboard/go-to-current-workspace', MainApp, HeaderComponent)
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
