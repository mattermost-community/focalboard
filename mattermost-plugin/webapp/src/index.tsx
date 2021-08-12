// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'
import {Store, Action} from 'redux'
import {Provider as ReduxProvider} from 'react-redux'
import {useHistory} from 'mm-react-router-dom'

import {GlobalState} from 'mattermost-redux/types/store'
import {getTheme} from 'mattermost-redux/selectors/entities/preferences'

const windowAny = (window as any)
windowAny.baseURL = '/plugins/focalboard'
windowAny.frontendBaseURL = '/boards'
windowAny.isFocalboardPlugin = true

import App from '../../../webapp/src/app'
import store from '../../../webapp/src/store'
import GlobalHeader from '../../../webapp/src/components/globalHeader/globalHeader'
import FocalboardIcon from '../../../webapp/src/widgets/icons/logo'
import {setMattermostTheme} from '../../../webapp/src/theme'

import '../../../webapp/src/styles/focalboard-variables.scss'
import '../../../webapp/src/styles/main.scss'
import '../../../webapp/src/styles/labels.scss'

import manifest from './manifest'
import ErrorBoundary from './error_boundary'

// eslint-disable-next-line import/no-unresolved
import {PluginRegistry} from './types/mattermost-webapp'

import './plugin.scss'

const GlobalHeaderIcon = () => {
    return (
        <span className='FocalboardGlobalHeaderIcon'>
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

    useEffect(() => {
        const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement
        const restoreData = {
            type: link.type,
            rel: link.rel,
            href: link.href,
        }
        return () => {
            link.type = restoreData.type
            link.rel = restoreData.rel
            link.href = restoreData.href
            document.getElementsByTagName('head')[0].appendChild(link)
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

        let theme = getTheme(store.getState())
        setMattermostTheme(theme)
        store.subscribe(() => {
            const currentTheme = getTheme(store.getState())
            if (currentTheme !== theme && currentTheme) {
                setMattermostTheme(currentTheme)
                theme = currentTheme
            }
        })

        if (this.registry.registerProduct) {
            windowAny.frontendBaseURL = '/boards'
            const goToFocalboardWorkspace = () => {
                const currentChannel = store.getState().entities.channels.currentChannelId
                window.open(`${window.location.origin}/boards/workspace/${currentChannel}`)
            }
            this.channelHeaderButtonId = registry.registerChannelHeaderButtonAction(<FocalboardIcon/>, goToFocalboardWorkspace, '', 'Focalboard Workspace')

            this.registry.registerCustomRoute('go-to-current-workspace', () => {
                const history = useHistory()
                useEffect(() => {
                    const currentChannel = store.getState().entities.channels.currentChannelId
                    if (currentChannel) {
                        history.replace(`/boards/workspace/${currentChannel}`)
                    } else {
                        history.goBack()
                    }
                }, [])
                return <></>
            })
            this.registry.registerProduct('/boards', GlobalHeaderIcon, 'Boards', '/plug/focalboard/go-to-current-workspace', MainApp, HeaderComponent)
        } else {
            windowAny.frontendBaseURL = '/plug/focalboard'
            this.channelHeaderButtonId = registry.registerChannelHeaderButtonAction(<FocalboardIcon/>, () => {
                const currentChannel = store.getState().entities.channels.currentChannelId
                window.open(`${window.location.origin}/plug/focalboard/workspace/${currentChannel}`)
            }, '', 'Focalboard Workspace')
            this.registry.registerCustomRoute('/', MainApp)
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
