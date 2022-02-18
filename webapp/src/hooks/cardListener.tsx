// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {useEffect} from 'react'

import {Block} from '../blocks/block'
import wsClient, {WSClient} from '../wsclient'

export default function useCardListener(onChange: (blocks: Block[]) => void, onReconnect: () => void): void {
    useEffect(() => {
        // ToDo: does this onChange need boards as well??
        const onChangeHandler = (_: WSClient, blocks: Block[]) => onChange(blocks)
        wsClient.addOnChange(onChangeHandler, 'block')
        wsClient.addOnReconnect(onReconnect)
        return () => {
            wsClient.removeOnChange(onChangeHandler, 'block')
            wsClient.removeOnReconnect(onReconnect)
        }
    }, [])
}
