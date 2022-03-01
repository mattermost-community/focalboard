// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react'

import {useIntl, FormattedMessage} from 'react-intl'
import {generatePath, useRouteMatch} from 'react-router'
import Select from 'react-select/async'
import {CSSObject} from '@emotion/serialize'

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

import {getSelectBaseStyle} from '../../theme'
import CompassIcon from '../../widgets/icons/compassIcon'
import IconButton from '../../widgets/buttons/iconButton'
import SearchIcon from '../../widgets/icons/search'

import TeamPermissionsRow from './teamPermissionsRow'
import UserPermissionsRow from './userPermissionsRow'

import './shareBoard.scss'

type Props = {
    onClose: () => void
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
    const [wasCopied, setWasCopied] = useState(false)
    const [sharing, setSharing] = useState<ISharing|undefined>(undefined)
    const [selectedUser, setSelectedUser] = useState<IUser|null>(null)

    // members of the current board
    const members = useAppSelector<{[key: string]: BoardMember}>(getCurrentBoardMembers)
    const board = useAppSelector(getCurrentBoard)
    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)
    const me = useAppSelector<IUser|null>(getMe)

    const intl = useIntl()
    const match = useRouteMatch<{teamId?: string, boardId: string, viewId: string}>()

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
        await client.setSharing(board.id, newSharing)
        await loadData()
    }

    const onRegenerateToken = async () => {
        // eslint-disable-next-line no-alert
        const accept = window.confirm(intl.formatMessage({id: 'ShareBoard.confirmRegenerateToken', defaultMessage: 'This will invalidate previously shared links. Continue?'}))
        if (accept) {
            const newSharing: ISharing = sharing || createSharingInfo()
            newSharing.token = Utils.createGuid(IDType.Token)
            await client.setSharing(board.id, newSharing)
            await loadData()

            const description = intl.formatMessage({id: 'ShareBoard.tokenRegenrated', defaultMessage: 'Token regenerated'})
            sendFlashMessage({content: description, severity: 'low'})
        }
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
        case 'Admin':
            if (member.schemeAdmin) {
                return
            }
            newMember.schemeAdmin = true
            newMember.schemeEditor = true
            break
        case 'Editor':
            if (!member.schemeAdmin && member.schemeEditor) {
                return
            }
            newMember.schemeEditor = true
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

    const isSharing = Boolean(sharing && sharing.id === board.id && sharing.enabled)
    const readToken = (sharing && isSharing) ? sharing.token : ''
    const shareUrl = new URL(window.location.toString())
    shareUrl.searchParams.set('r', readToken)

    if (match.params.teamId) {
        const newPath = generatePath('/team/:teamId/shared/:boardId/:viewId', {
            boardId: match.params.boardId,
            viewId: match.params.viewId,
            teamId: match.params.teamId,
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
                    <Select
                        styles={styles}
                        value={selectedUser}
                        className={'userSearchInput'}
                        cacheOptions={true}
                        loadOptions={(inputValue) => client.searchTeamUsers(inputValue)}
                        components={{DropdownIndicator: () => null, IndicatorSeparator: () => null}}
                        defaultOptions={true}
                        getOptionValue={(u) => u.id}
                        getOptionLabel={(u) => u.username}
                        isMulti={false}
                        onChange={(newValue) => {
                            if (newValue) {
                                mutator.createBoardMember(board.id, newValue.id)
                                setSelectedUser(null)
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
                            onDeleteBoardMember={onDeleteBoardMember}
                            onUpdateBoardMember={onUpdateBoardMember}
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
                                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareLinkPublicCopy, {board: board.id})
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
