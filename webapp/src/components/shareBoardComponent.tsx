// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, useRouteMatch} from 'react-router'

import {ISharing} from '../blocks/sharing'

import client from '../octoClient'

import {Utils, IDType} from '../utils'
import {sendFlashMessage} from '../components/flashMessages'

import Button from '../widgets/buttons/button'
import Switch from '../widgets/switch'

import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'

import Modal from './modal'
import './shareBoardComponent.scss'

type Props = {
    boardId: string
    onClose: () => void
}

const ShareBoardComponent = React.memo((props: Props): JSX.Element => {
    const [wasCopied, setWasCopied] = useState(false)
    const [sharing, setSharing] = useState<ISharing|undefined>(undefined)
    const intl = useIntl()
    const match = useRouteMatch<{workspaceId?: string, boardId: string, viewId: string}>()

    const loadData = async () => {
        const newSharing = await client.getSharing(props.boardId)
        setSharing(newSharing)
        setWasCopied(false)
    }

    const createSharingInfo = () => {
        const newSharing: ISharing = {
            id: props.boardId,
            enabled: true,
            token: Utils.createGuid(IDType.Token),
        }
        return newSharing
    }

    const onShareChanged = async (isOn: boolean) => {
        const newSharing: ISharing = sharing || createSharingInfo()
        newSharing.id = props.boardId
        newSharing.enabled = isOn
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoard, {board: props.boardId, enabled: isOn})
        await client.setSharing(newSharing)
        await loadData()
    }

    const onRegenerateToken = async () => {
        // eslint-disable-next-line no-alert
        const accept = window.confirm(intl.formatMessage({id: 'ShareBoard.confirmRegenerateToken', defaultMessage: 'This will invalidate previously shared links. Continue?'}))
        if (accept) {
            const newSharing: ISharing = sharing || createSharingInfo()
            newSharing.token = Utils.createGuid(IDType.Token)
            await client.setSharing(newSharing)
            await loadData()

            const description = intl.formatMessage({id: 'ShareBoard.tokenRegenrated', defaultMessage: 'Token regenerated'})
            sendFlashMessage({content: description, severity: 'low'})
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const isSharing = Boolean(sharing && sharing.id === props.boardId && sharing.enabled)
    const readToken = (sharing && isSharing) ? sharing.token : ''

    const shareUrl = new URL(window.location.toString())
    shareUrl.searchParams.set('r', readToken)

    if (match.params.workspaceId) {
        const newPath = generatePath('/plugins/focalboard/workspace/:workspaceId/shared/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
            workspaceId: match.params.workspaceId,
        })
        shareUrl.pathname = newPath
    } else {
        const newPath = generatePath('/shared/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
        })
        shareUrl.pathname = newPath
    }

    return (
        <Modal
            onClose={props.onClose}
        >
            <div className='ShareBoardComponent'>
                <div className='row'>
                    <div>
                        {isSharing &&
                            <FormattedMessage
                                id='ShareBoard.unshare'
                                defaultMessage='Anyone with the link can view this board and all cards in it.'
                            />}
                        {!isSharing &&
                            <FormattedMessage
                                id='ShareBoard.share'
                                defaultMessage='Publish and share this board with anyone who has the link'
                            />}
                    </div>
                    <Switch
                        isOn={Boolean(isSharing)}
                        onChanged={onShareChanged}
                    />
                </div>
                {isSharing && <>
                    <div className='row'>
                        <a
                            className='shareUrl'
                            href={shareUrl.toString()}
                            target='_blank'
                            rel='noreferrer'
                        >
                            {shareUrl.toString()}
                        </a>
                        <Button
                            filled={true}
                            size='small'
                            onClick={() => {
                                Utils.copyTextToClipboard(shareUrl.toString())
                                setWasCopied(true)
                            }}
                        >
                            {wasCopied &&
                                <FormattedMessage
                                    id='ShareBoard.copiedLink'
                                    defaultMessage='Copied!'
                                />}
                            {!wasCopied &&
                                <FormattedMessage
                                    id='ShareBoard.copyLink'
                                    defaultMessage='Copy link'
                                />}
                        </Button>
                    </div>
                    <div className='row'>
                        <Button
                            onClick={onRegenerateToken}
                            emphasis='secondary'
                            size='small'
                        >
                            <FormattedMessage
                                id='ShareBoard.regenerateToken'
                                defaultMessage='Regenerate token'
                            />
                        </Button>
                    </div>
                </>}
            </div>
        </Modal>
    )
})

export default ShareBoardComponent
