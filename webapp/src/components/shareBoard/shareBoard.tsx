// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'
import {generatePath, useRouteMatch} from 'react-router'

import {Utils, IDType} from '../../utils'
import Tooltip from '../../widgets/tooltip'

import {ISharing} from '../../blocks/sharing'

import client from '../../octoClient'
import Dialog from '../dialog'
import Switch from '../../widgets/switch'
import Button from '../../widgets/buttons/button'
import {sendFlashMessage} from '../flashMessages'

import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import CompassIcon from '../../widgets/icons/compassIcon'
import IconButton from '../../widgets/buttons/iconButton'
import './shareBoard.scss'

type Props = {
    boardId: string
    onClose: () => void
}

export default function ShareBoardDialog(props: Props): JSX.Element {
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
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoard, {board: props.boardId, shareBoardEnabled: isOn})
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
        const newPath = generatePath('/workspace/:workspaceId/shared/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
            workspaceId: match.params.workspaceId,
        })
        shareUrl.pathname = Utils.buildURL(newPath)
    } else {
        const newPath = generatePath('/shared/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
        })
        shareUrl.pathname = Utils.buildURL(newPath)
    }

    return (
        <Dialog
            onClose={props.onClose}
            className='ShareBoardDialog'
            title={intl.formatMessage({id: 'ShareBoard.Title', defaultMessage: 'Share Board'})}
        >
            <div className='tabs-modal'>
                <div>
                    <div className='d-flex justify-content-between'>
                        <div className='d-flex flex-column'>
                            <div className='text-heading2'>{intl.formatMessage({id: 'ShareBoard.PublishTitle', defaultMessage: 'Publish to the web'})}</div>
                            <div className='text-light'>{intl.formatMessage({id: 'ShareBoard.PublishDescription', defaultMessage: 'Publish and share a “read only” link with everyone on the web'})}</div>
                        </div>
                        <div>
                            <Switch
                                isOn={isSharing}
                                size='medium'
                                onChanged={onShareChanged}
                            />
                        </div>
                    </div>
                </div>
                {isSharing &&
                        (<div className='d-flex justify-content-between tabs-inputs'>
                            <div className='d-flex input-container'>
                                <a
                                    className='shareUrl'
                                    href={shareUrl.toString()}
                                    target='_blank'
                                    rel='noreferrer'
                                >
                                    {shareUrl.toString()}
                                </a>
                                <Tooltip
                                    key={'regenerateToken'}
                                    title={intl.formatMessage({id: 'ShareBoard.regenerate', defaultMessage: 'Regenerate token'})}
                                >
                                    <IconButton
                                        size='small'
                                        onClick={onRegenerateToken}
                                        icon={
                                            <CompassIcon
                                                icon='refresh'
                                            />}
                                        title={intl.formatMessage({id: 'ShareBoard.regenerate', defaultMessage: 'Regenerate token'})}
                                    />
                                </Tooltip>
                            </div>
                            <Button
                                emphasis='secondary'
                                size='medium'
                                title='Copy link'
                                icon={
                                    <CompassIcon
                                        icon='content-copy'
                                        className='CompassIcon'
                                    />
                                }
                                onClick={() => {
                                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareLinkPublicCopy, {board: props.boardId})
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
                        </div>)
                }
            </div>
        </Dialog>
    )
}
