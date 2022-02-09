// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react'

import {useIntl, FormattedMessage} from 'react-intl'
import {generatePath, useRouteMatch} from 'react-router'

import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard, getCurrentBoardMembers} from '../../store/boards'
import {getMe, getBoardUsersList} from '../../store/users'

import {Utils, IDType} from '../../utils'
import Tooltip from '../../widgets/tooltip'
import mutator from '../../mutator'

import {ISharing} from '../../blocks/sharing'
import {BoardMember} from '../../blocks/board'

import client from '../../octoClient'
import Dialog from '../dialog'
import {IUser} from '../../user'
import Switch from '../../widgets/switch'
import Button from '../../widgets/buttons/button'
import {sendFlashMessage} from '../flashMessages'

import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import CompassIcon from '../../widgets/icons/compassIcon'
import IconButton from '../../widgets/buttons/iconButton'
import SearchIcon from '../../widgets/icons/search'

import TeamPermissionsRow from './teamPermissionsRow'
import UserPermissionsRow from './userPermissionsRow'

import './shareBoard.scss'

type Props = {
    onClose: () => void
}

export default function ShareBoardDialog(props: Props): JSX.Element {
    const [wasCopied, setWasCopied] = useState(false)
    const [sharing, setSharing] = useState<ISharing|undefined>(undefined)
    const [term, setTerm] = useState<string>('')
    const [teamUsers, setTeamUsers] = useState<IUser[]>([])

    // members of the current board
    const members = useAppSelector<{[key: string]: BoardMember}>(getCurrentBoardMembers)
    const board = useAppSelector(getCurrentBoard)
    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)
    const me = useAppSelector<IUser|null>(getMe)

    const intl = useIntl()
    const match = useRouteMatch<{workspaceId?: string, boardId: string, viewId: string}>()

    const loadData = async () => {
        const newSharing = await client.getSharing(board.id)
        setSharing(newSharing)
        setWasCopied(false)
    }

    const createSharingInfo = () => {
        const newSharing: ISharing = {
            id: board.id,
            enabled: true,
            token: Utils.createGuid(IDType.Token),
        }
        return newSharing
    }

    const onShareChanged = async (isOn: boolean) => {
        const newSharing: ISharing = sharing || createSharingInfo()
        newSharing.id = board.id
        newSharing.enabled = isOn
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoard, {board: board.id, shareBoardEnabled: isOn})
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

    const isSharing = Boolean(sharing && sharing.id === board.id && sharing.enabled)
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
            {/* ToDo: Make an autocomplete */}
            <div className='share-input__container'>
                <div className='share-input'>
                    <SearchIcon/>
                    <input
                        type='text'
                        placeholder='Add people or groups'
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.stopPropagation()
                                const user = teamUsers.find((u) => u.username === term)
                                if (!user) {
                                    return
                                }

                                mutator.createBoardMember(board.id, user.id)
                                setTerm('')
                            }
                        }}
                    />
                </div>
            </div>
            <div className='user-items'>
                <TeamPermissionsRow/>

                {Object.values(members).map((member) => {
                    const user = boardUsers.find((u) => u.id === member.userId)
                    if (!user) {
                        return null
                    }

                    return (
                        <UserPermissionsRow
                            key={user.id}
                            user={user}
                            member={member}
                            isMe={user.id === me?.id}
                        />
                    )
                })}
            </div>

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
                                        onClick={onRegenerateToken}
                                        icon={
                                            <CompassIcon
                                                icon='refresh'
                                                className='Icon Icon--right'
                                            />}
                                        title={intl.formatMessage({id: 'ShareBoard.regenerate', defaultMessage: 'Regenerate token'})}
                                        className='IconButton--large'
                                    />
                                </Tooltip>
                            </div>
                            <Button
                                emphasis='secondary'
                                size='medium'
                                title='Copy link'
                                onClick={() => {
                                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareLinkPublicCopy, {board: board.id})
                                    Utils.copyTextToClipboard(shareUrl.toString())
                                    setWasCopied(true)
                                }}
                            >
                                <CompassIcon
                                    icon='content-copy'
                                    className='CompassIcon'
                                />
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
