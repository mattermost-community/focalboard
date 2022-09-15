// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'

import wsClient, {MMWebSocketClient} from '../wsclient'
import {Utils} from '../utils'

type Props = {
    userId?: string
    manifest?: {
        id: string
        version: string
    }
    webSocketClient?: MMWebSocketClient
    children: React.ReactNode
}

// WithWebSockets component initialises the websocket connection if
// it's not yet running and subscribes to the current team
const WithWebSockets = (props: Props): React.ReactElement => {
    const queryString = new URLSearchParams(window.location.search)

    useEffect(() => {
        // if the websocket client was already connected, do nothing
        if (wsClient.state !== 'init') {
            return
        }

        // this is a temporary solution to disable websocket
        // connections on legacy routes, as there is no such thing as
        // an anonymous websocket connection
        if (Utils.isFocalboardLegacy()) {
            return
        }

        if (!Utils.isFocalboardPlugin()) {
            const token = localStorage.getItem('focalboardSessionId') || queryString.get('r') || ''
            if (token) {
                wsClient.authenticate(token)
            }
            wsClient.open()
            return
        }

        if (!props.webSocketClient) {
            Utils.logWarn('Trying to initialise Boards websocket in plugin mode without base connection. Aborting')
            return
        }

        if (!props.manifest?.id || !props.manifest?.version) {
            Utils.logError('Trying to initialise Boards websocket in plugin mode with an incomplete manifest. Aborting')
            return
        }

        wsClient.initPlugin(props.manifest?.id, props.manifest?.version, props.webSocketClient)
        wsClient.open()
    }, [props.webSocketClient])

    useEffect(() => {
        // if we're running on a plugin instance or we don't have a
        // user yet, do nothing
        if (Utils.isFocalboardPlugin() || !props.userId) {
            return
        }

        const token = localStorage.getItem('focalboardSessionId') || queryString.get('r') || ''
        if (wsClient.token !== token) {
            wsClient.authenticate(token)
        }
    }, [props.userId])

    return (
        <>
            {props.children}
        </>
    )
}

export default WithWebSockets
