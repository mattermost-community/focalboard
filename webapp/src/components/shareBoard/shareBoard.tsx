// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react'

import {useIntl, FormattedMessage} from 'react-intl'
import {generatePath, useRouteMatch} from 'react-router-dom'
import Select from 'react-select/async'
import {CSSObject} from '@emotion/serialize'

import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard, getCurrentBoardMembers} from '../../store/boards'
import {Channel} from '../../store/channels'
import {getMe, getBoardUsersList} from '../../store/users'

import {ClientConfig} from '../../config/clientConfig'
import {getClientConfig} from '../../store/clientConfig'

import {Utils, IDType} from '../../utils'
import Tooltip from '../../widgets/tooltip'
import mutator from '../../mutator'

import {ISharing} from '../../blocks/sharing'
import {BoardMember, createBoard, MemberRole} from '../../blocks/board'

import client from '../../octoClient'
import Dialog from '../dialog'
import ConfirmationDialog from '../confirmationDialogBox'
import {IUser} from '../../user'
import Switch from '../../widgets/switch'
import Button from '../../widgets/buttons/button'
import {sendFlashMessage} from '../flashMessages'
import {Permission} from '../../constants'
import GuestBadge from '../../widgets/guestBadge'
import AdminBadge from '../../widgets/adminBadge/adminBadge'

import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import {getSelectBaseStyle} from '../../theme'
import CompassIcon from '../../widgets/icons/compassIcon'
import IconButton from '../../widgets/buttons/iconButton'
import SearchIcon from '../../widgets/icons/search'

import BoardPermissionGate from '../permissions/boardPermissionGate'

import {useHasPermissions} from '../../hooks/permissions'

import TeamPermissionsRow from './teamPermissionsRow'
import UserPermissionsRow from './userPermissionsRow'

import './shareBoard.scss'

type Props = {
    onClose: () => void
    enableSharedBoards: boolean
}

const baseStyles = getSelectBaseStyle()

const styles = {
    ...baseStyles,
    control: (): CSSObject => ({
        border: 0,
        width: '100%',
        height: '100%',
        margin: '0',
        display: 'flex',
        flexDirection: 'row',
    }),
    menu: (provided: CSSObject): CSSObject => ({
        ...provided,
        minWidth: '100%',
        width: 'max-content',
        background: 'rgb(var(--center-channel-bg-rgb))',
        left: '0',
        marginBottom: '0',
    }),
    singleValue: (provided: CSSObject): CSSObject => ({
        ...baseStyles.singleValue(provided),
        opacity: '0.8',
        fontSize: '12px',
        right: '0',
        textTransform: 'uppercase',
    }),
}

function isLastAdmin(members: BoardMember[]) {
    let adminCount = 0
    for (const member of members) {
        if (member.schemeAdmin) {
            if (++adminCount > 1) {
                return false
            }
        }
    }
    return true
}

export default function ShareBoardDialog(props: Props): JSX.Element {
    const [wasCopiedPublic, setWasCopiedPublic] = useState(false)
    const [wasCopiedInternal, setWasCopiedInternal] = useState(false)
    const [showLinkChannelConfirmation, setShowLinkChannelConfirmation] = useState<Channel|null>(null)
    const [sharing, setSharing] = useState<ISharing|undefined>(undefined)
    const [selectedUser, setSelectedUser] = useState<IUser|Channel|null>(null)
    const clientConfig = useAppSelector<ClientConfig>(getClientConfig)

    // members of the current board
    const members = useAppSelector<{[key: string]: BoardMember}>(getCurrentBoardMembers)
    const board = useAppSelector(getCurrentBoard)
    const boardId = board.id
    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)
    const me = useAppSelector<IUser|null>(getMe)

    const [publish, setPublish] = useState(false)

    const intl = useIntl()
    const match = useRouteMatch<{teamId?: string, boardId: string, viewId: string}>()

    const hasSharePermissions = useHasPermissions(board.teamId, boardId, [Permission.ShareBoard])

    const loadData = async () => {
        if (hasSharePermissions) {
            const newSharing = await client.getSharing(boardId)
            setSharing(newSharing)
            setWasCopiedPublic(false)
        }
    }

    const createSharingInfo = () => {
        const newSharing: ISharing = {
            id: boardId,
            enabled: true,
            token: Utils.createGuid(IDType.Token),
        }
        return newSharing
    }

    const onShareChanged = async (isOn: boolean) => {
        const newSharing: ISharing = sharing || createSharingInfo()
        newSharing.id = boardId
        newSharing.enabled = isOn
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoard, {board: boardId, shareBoardEnabled: isOn})
        await client.setSharing(boardId, newSharing)
        await loadData()
    }

    const onLinkBoard = async (channel: Channel, confirmed?: boolean) => {
        if (!confirmed) {
            setShowLinkChannelConfirmation(channel)
            return
        }
        setShowLinkChannelConfirmation(null)
        const newBoard = createBoard(board)
        newBoard.channelId = channel.id // This is a channel ID hardcoded here as an example
        mutator.updateBoard(newBoard, board, 'linked channel')
    }

    const onRegenerateToken = async () => {
        // eslint-disable-next-line no-alert
        const accept = window.confirm(intl.formatMessage({id: 'ShareBoard.confirmRegenerateToken', defaultMessage: 'This will invalidate previously shared links. Continue?'}))
        if (accept) {
            const newSharing: ISharing = sharing || createSharingInfo()
            newSharing.token = Utils.createGuid(IDType.Token)
            await client.setSharing(boardId, newSharing)
            await loadData()

            const description = intl.formatMessage({id: 'ShareBoard.tokenRegenrated', defaultMessage: 'Token regenerated'})
            sendFlashMessage({content: description, severity: 'low'})
        }
    }

    const addUser = (user: IUser) => {
        const minimumRole = board.minimumRole || MemberRole.Viewer
        const newMember = {
            boardId,
            userId: user.id,
            roles: minimumRole,
            schemeEditor: minimumRole === MemberRole.Editor,
            schemeCommenter: minimumRole === MemberRole.Editor || minimumRole === MemberRole.Commenter,
            schemeViewer: minimumRole === MemberRole.Editor || minimumRole === MemberRole.Commenter || minimumRole === MemberRole.Viewer,
        } as BoardMember
        mutator.createBoardMember(newMember)
    }

    const onUpdateBoardMember = (member: BoardMember, newPermission: string) => {
        if (member.userId === me?.id && isLastAdmin(Object.values(members))) {
            sendFlashMessage({content: intl.formatMessage({id: 'shareBoard.lastAdmin', defaultMessage: 'Boards must have at least one Administrator'}), severity: 'low'})
            return
        }

        const newMember = {
            boardId: member.boardId,
            userId: member.userId,
            roles: member.roles,
        } as BoardMember

        switch (newPermission) {
        case MemberRole.Admin:
            if (member.schemeAdmin) {
                return
            }
            newMember.schemeAdmin = true
            newMember.schemeEditor = true
            break
        case MemberRole.Editor:
            if (!member.schemeAdmin && member.schemeEditor) {
                return
            }
            newMember.schemeAdmin = false
            newMember.schemeEditor = true
            break
        case MemberRole.Commenter:
            if (!member.schemeAdmin && !member.schemeEditor && member.schemeCommenter) {
                return
            }
            newMember.schemeAdmin = false
            newMember.schemeEditor = false
            newMember.schemeCommenter = true
            break
        case MemberRole.Viewer:
            if (!member.schemeAdmin && !member.schemeEditor && !member.schemeCommenter && member.schemeViewer) {
                return
            }
            newMember.schemeAdmin = false
            newMember.schemeEditor = false
            newMember.schemeCommenter = false
            newMember.schemeViewer = true
            break
        default:
            return
        }

        mutator.updateBoardMember(newMember, member)
    }

    const onDeleteBoardMember = (member: BoardMember) => {
        if (member.userId === me?.id && isLastAdmin(Object.values(members))) {
            sendFlashMessage({content: intl.formatMessage({id: 'shareBoard.lastAdmin', defaultMessage: 'Boards must have at least one Administrator'}), severity: 'low'})
            return
        }
        mutator.deleteBoardMember(member)
    }

    useEffect(() => {
        loadData()
    }, [])

    const isSharing = Boolean(sharing && sharing.id === boardId && sharing.enabled)
    const readToken = (sharing && isSharing) ? sharing.token : ''
    const shareUrl = new URL(window.location.toString())
    shareUrl.searchParams.set('r', readToken)
    const boardUrl = new URL(window.location.toString())

    if (match.params.teamId) {
        const newPath = generatePath('/team/:teamId/shared/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
            teamId: match.params.teamId,
        })
        shareUrl.pathname = Utils.buildURL(newPath)

        const boardPath = generatePath('/team/:teamId/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
            teamId: match.params.teamId,
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

    const shareBoardTitle = (
        <FormattedMessage
            id={'ShareBoard.Title'}
            defaultMessage={'Share Board'}
        />
    )

    const shareTemplateTitle = (
        <FormattedMessage
            id={'ShareTemplate.Title'}
            defaultMessage={'Share Template'}
        />
    )

    const formatOptionLabel = (userOrChannel: IUser | Channel) => {
        if ((userOrChannel as IUser).username) {
            const user = userOrChannel as IUser
            return (
                <div className='user-item'>
                    <div className='ml-3'>
                        <strong>{Utils.getUserDisplayName(user, clientConfig.teammateNameDisplay)}</strong>
                        <strong className='ml-2 text-light'>{`@${user.username}`}</strong>
                        <GuestBadge show={Boolean(user?.is_guest)}/>
                        <AdminBadge permissions={user.permissions}/>
                    </div>
                </div>
            )
        }

        return null
    }

    let confirmSubtext
    let confirmButtonText
    if (board.channelId === '') {
        confirmSubtext = intl.formatMessage({id: 'shareBoard.confirm-link-channel-subtext', defaultMessage: 'When you link a channel to a board, all members of the channel (existing and new) will be able to edit it. This excludes members who are guests.'})
        confirmButtonText = intl.formatMessage({id: 'shareBoard.confirm-link-channel-button', defaultMessage: 'Link channel'})
    } else {
        confirmSubtext = intl.formatMessage({id: 'shareBoard.confirm-link-channel-subtext-with-other-channel', defaultMessage: 'When you link a channel to a board, all members of the channel (existing and new) will be able to edit it. This excludes members who are guests.{lineBreak}This board is currently linked to another channel.\nIt will be unlinked if you choose to link it here.'}, {lineBreak: <p/>})
        confirmButtonText = intl.formatMessage({id: 'shareBoard.confirm-link-channel-button-with-other-channel', defaultMessage: 'Unlink and link here'})
    }

    return (
        <Dialog
            onClose={props.onClose}
            title={board.isTemplate ? shareTemplateTitle : shareBoardTitle}
            className='ShareBoardDialog'
        >
            {showLinkChannelConfirmation &&
                <ConfirmationDialog
                    dialogBox={{
                        heading: intl.formatMessage({id: 'shareBoard.confirm-link-channel', defaultMessage: 'Link board to channel'}),
                        subText: confirmSubtext,
                        confirmButtonText,
                        destructive: board.channelId !== '',
                        onConfirm: () => onLinkBoard(showLinkChannelConfirmation, true),
                        onClose: () => setShowLinkChannelConfirmation(null),
                    }}
                />}
            <BoardPermissionGate permissions={[Permission.ManageBoardRoles]}>
                <div className='share-input__container'>
                    <div className='share-input'>
                        <SearchIcon/>
                        <Select
                            styles={styles}
                            value={selectedUser}
                            className={'userSearchInput'}
                            cacheOptions={true}
                            filterOption={(o) => {
                                // render non-explicit members
                                if (members[o.value]) {
                                    return members[o.value].synthetic
                                }

                                // not a member, definitely render
                                return true
                            }}
                            loadOptions={async (inputValue: string) => {
                                const result = []
                                const users = await client.searchTeamUsers(inputValue) || []
                                result.push(...users)
                                return result
                            }}
                            components={{DropdownIndicator: () => null, IndicatorSeparator: () => null}}
                            defaultOptions={true}
                            formatOptionLabel={formatOptionLabel}
                            getOptionValue={(u) => u.id}
                            getOptionLabel={(u: IUser|Channel) => (u as IUser).username || (u as Channel).display_name}
                            isMulti={false}
                            placeholder={board.isTemplate ? intl.formatMessage({id: 'ShareTemplate.searchPlaceholder', defaultMessage: 'Search for people'}) : intl.formatMessage({id: 'ShareBoard.searchPlaceholder', defaultMessage: 'Search for people and channels'})
                            }
                            onChange={(newValue) => {
                                if (newValue && (newValue as IUser).username) {
                                    addUser(newValue as IUser)
                                    setSelectedUser(null)
                                } else if (newValue) {
                                    onLinkBoard(newValue as Channel)
                                }
                            }}
                        />
                    </div>
                </div>
            </BoardPermissionGate>
            <div className='user-items'>
                <TeamPermissionsRow/>

                {boardUsers.map((user) => {
                    if (!members[user.id]) {
                        return null
                    }
                    if (members[user.id].synthetic) {
                        return null
                    }
                    return (
                        <UserPermissionsRow
                            key={user.id}
                            user={user}
                            member={members[user.id]}
                            teammateNameDisplay={me?.props?.teammateNameDisplay || clientConfig.teammateNameDisplay}
                            onDeleteBoardMember={onDeleteBoardMember}
                            onUpdateBoardMember={onUpdateBoardMember}
                            isMe={user.id === me?.id}
                        />
                    )
                })}
            </div>

            {props.enableSharedBoards && !board.isTemplate && (
                <div className='tabs-container'>
                    <button
                        onClick={() => setPublish(false)}
                        className={`tab-item ${!publish && 'tab-item--active'}`}
                    >
                        <FormattedMessage
                            id='share-board.share'
                            defaultMessage='Share'
                        />
                    </button>
                    <BoardPermissionGate permissions={[Permission.ShareBoard]}>
                        <button
                            onClick={() => setPublish(true)}
                            className={`tab-item ${publish && 'tab-item--active'}`}
                        >
                            <FormattedMessage
                                id='share-board.publish'
                                defaultMessage='Publish'
                            />
                        </button>
                    </BoardPermissionGate>
                </div>
            )}
            {(props.enableSharedBoards && publish && !board.isTemplate) &&
            (<BoardPermissionGate permissions={[Permission.ShareBoard]}>
                <div className='tabs-content'>
                    <div>
                        <div className='d-flex justify-content-between'>
                            <div className='d-flex flex-column'>
                                <div className='text-heading2'>{intl.formatMessage({id: 'ShareBoard.PublishTitle', defaultMessage: 'Publish to the web'})}</div>
                                <div className='text-light'>{intl.formatMessage({id: 'ShareBoard.PublishDescription', defaultMessage: 'Publish and share a read-only link with everyone on the web.'})}</div>
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
                                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareLinkPublicCopy, {board: boardId})
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
            </BoardPermissionGate>
            )}

            {!publish && !board.isTemplate && (
                <div className='tabs-content'>
                    <div>
                        <div className='d-flex justify-content-between'>
                            <div className='d-flex flex-column'>
                                <div className='text-heading2'>{intl.formatMessage({id: 'ShareBoard.ShareInternal', defaultMessage: 'Share internally'})}</div>
                                <div className='text-light'>{intl.formatMessage({id: 'ShareBoard.ShareInternalDescription', defaultMessage: 'Users who have permissions will be able to use this link.'})}</div>
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
                            title={intl.formatMessage({id: 'ShareBoard.copyLink', defaultMessage: 'Copy link'})}
                            onClick={() => {
                                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareLinkInternalCopy, {board: boardId})
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
