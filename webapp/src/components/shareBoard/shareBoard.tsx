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
    enableSharedBoards: boolean
}

export default function ShareBoardDialog(props: Props): JSX.Element {
    const [wasCopiedPublic, setWasCopiedPublic] = useState(false)
    const [wasCopiedInternal, setWasCopiedInternal] = useState(false)
    const [sharing, setSharing] = useState<ISharing|undefined>(undefined)
    const [publish, setPublish] = useState(false)

    const intl = useIntl()
    const match = useRouteMatch<{workspaceId?: string, boardId: string, viewId: string}>()

    const loadData = async () => {
        const newSharing = await client.getSharing(props.boardId)
        setSharing(newSharing)
        setWasCopiedPublic(false)
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
    const boardUrl = new URL(window.location.toString())

    if (match.params.workspaceId) {
        const newPath = generatePath('/workspace/:workspaceId/shared/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
            workspaceId: match.params.workspaceId,
        })
        shareUrl.pathname = Utils.buildURL(newPath)

        const boardPath = generatePath('/workspace/:workspaceId/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
            workspaceId: match.params.workspaceId,
        })
        boardUrl.pathname = Utils.getFrontendBaseURL() + boardPath
    } else {
        const newPath = generatePath('/shared/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
        })
        shareUrl.pathname = Utils.buildURL(newPath)
        boardUrl.pathname = Utils.buildURL(
            generatePath(':boardId/:viewId', {
                boardId: match.params.boardId,
                viewId: match.params.viewId,
            },
            ))
    }

    return (
        <Dialog
            onClose={props.onClose}
            className='ShareBoardDialog'
            title={' '}
        >
            {props.enableSharedBoards && (
                <div className='tabs-container'>
                    <button
                        onClick={() => setPublish(false)}
                        className={`tab-item ${!publish && 'tab-item--active'}`}
                    >{'Share'}</button>
                    <button
                        onClick={() => setPublish(true)}
                        className={`tab-item ${publish && 'tab-item--active'}`}
                    >{'Publish'}</button>
                </div>
            )}
            {(props.enableSharedBoards && publish) &&
            (<div className='tabs-content'>
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
                                title='Copy public link'
                                icon={
                                    <CompassIcon
                                        icon='content-copy'
                                        className='CompassIcon'
                                    />
                                }
                                onClick={() => {
                                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareLinkPublicCopy, {board: props.boardId})
                                    Utils.copyTextToClipboard(shareUrl.toString())
                                    setWasCopiedPublic(true)
                                    setWasCopiedInternal(false)
                                }}
                            >
                                {wasCopiedPublic &&
                                    <FormattedMessage
                                        id='ShareBoard.copiedLink'
                                        defaultMessage='Copied!'
                                    />}
                                {!wasCopiedPublic &&
                                    <FormattedMessage
                                        id='ShareBoard.copyLink'
                                        defaultMessage='Copy link'
                                    />}
                            </Button>
                        </div>)
                }
            </div>
            )}

            {!publish && (
                <div className='tabs-content'>
                    <div>
                        <div className='d-flex justify-content-between'>
                            <div className='d-flex flex-column'>
                                <div className='text-heading2'>{intl.formatMessage({id: 'ShareBoard.ShareInternal', defaultMessage: 'Share internally'})}</div>
                                <div className='text-light'>{intl.formatMessage({id: 'ShareBoard.ShareInternalDescription', defaultMessage: 'Users who have permissions will be able to use this link'})}</div>
                            </div>
                        </div>
                    </div>
                    <div className='d-flex justify-content-between tabs-inputs'>
                        <div className='d-flex input-container'>
                            <a
                                className='shareUrl'
                                href={boardUrl.toString()}
                                target='_blank'
                                rel='noreferrer'
                            >
                                {boardUrl.toString()}
                            </a>
                        </div>
                        <Button
                            emphasis='secondary'
                            size='medium'
                            title='Copy internal link'
                            onClick={() => {
                                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareLinkInternalCopy, {board: props.boardId})
                                Utils.copyTextToClipboard(boardUrl.toString())
                                setWasCopiedPublic(false)
                                setWasCopiedInternal(true)
                            }}
                            icon={
                                <CompassIcon
                                    icon='content-copy'
                                    className='CompassIcon'
                                />
                            }
                        >
                            {wasCopiedInternal &&
                                <FormattedMessage
                                    id='ShareBoard.copiedLink'
                                    defaultMessage='Copied!'
                                />}
                            {!wasCopiedInternal &&
                                <FormattedMessage
                                    id='ShareBoard.copyLink'
                                    defaultMessage='Copy link'
                                />}
                        </Button>
                    </div>
                </div>
            )}
        </Dialog>
    )
}
