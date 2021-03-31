// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {useEffect} from 'react'

import {IBlock} from '../blocks/block'
import octoClient from '../octoClient'
import {OctoListener} from '../octoListener'
import {Utils} from '../utils'

export default function useCardListener(cardIds: string[], onChange: (blocks: IBlock[]) => void, onReconnect: () => void): void {
    let cardListener: OctoListener | null = null

    const deleteListener = () => {
        cardListener?.close()
        cardListener = null
    }

    const createListener = () => {
        deleteListener()

        cardListener = new OctoListener()
        cardListener.open(
            octoClient.workspaceId,
            cardIds,
            onChange,
            onReconnect,
        )
    }

    const createCardTreeAndSync = async () => {
        onReconnect()
        createListener()
    }

    useEffect(() => {
        Utils.log(`useCardListener.connect: ${cardIds}`)
        createCardTreeAndSync()
        return () => {
            Utils.log(`useCardListener.disconnect: ${cardIds}`)
            deleteListener()
        }
    }, [cardIds.join('-')])
}
