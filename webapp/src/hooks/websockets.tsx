// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'
import wsClient, {WSClient} from '../wsclient'

export const useWebsockets = (teamId: string, fn: (wsClient: WSClient) => () => void, deps: any[] = []): void => {
    useEffect(() => {
        wsClient.subscribeToTeam(teamId)
        const teardown = fn(wsClient)

        return () => {
            teardown()
            wsClient.unsubscribeToTeam(teamId)
        }
    }, [teamId, ...deps])
}
