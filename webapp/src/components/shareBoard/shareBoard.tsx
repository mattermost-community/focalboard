// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react'
import {FormattedMessage} from 'react-intl'

import {Utils} from '../../utils'
import {useAppSelector, useAppDispatch} from '../../store/hooks'
import {BoardMember} from '../../blocks/board'
import {IUser} from '../../user'
import {getMe, getBoardUsersList} from '../../store/users'
import {getCurrentBoard, getCurrentBoardMembers} from '../../store/boards'
import {getClientConfig} from '../../store/clientConfig'
import client from '../../octoClient'

import './shareBoard.scss'
import RootPortal from '../rootPortal'
import Dialog from '../dialog'
import MenuWrapper from '../../widgets/menuWrapper'
import Menu from '../../widgets/menu'
import Switch from '../../widgets/switch'
import Button from '../../widgets/buttons/button'
import TeamPermissionsRow from './teamPermissionsRow'
import UserPermissionsRow from './userPermissionsRow'

import CheckIcon from '../../widgets/icons/check'
import CompassIcon from '../../widgets/icons/compassIcon'
import SearchIcon from '../../widgets/icons/search'

import mutator from '../../mutator'


type Props = {
    onClose: () => void
}

const ShareBoardDialog = (props: Props): JSX.Element => {
    const dispatch = useAppDispatch()
    const [wasCopied, setWasCopied] = useState(false)
    const [publicBoard, setPublicBoard] = useState(false)
    const [teamUsers, setTeamUsers] = useState<IUser[]>([])
    const [term, setTerm] = useState<string>('')

    // ToDo: we should implement autocompletion here and load the team
    // users as the user types to avoid fetching all team users and
    // storing them in memory
    useEffect(() => {
        client.getTeamUsers().then(teamUsers => setTeamUsers(teamUsers))
    }, [])

    const me = useAppSelector<IUser|null>(getMe)

    // members of the current board
    const members = useAppSelector<{[key: string]: BoardMember}>(getCurrentBoardMembers)

    const board = useAppSelector(getCurrentBoard)

    // list of all users
    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)

    // the "Share internally" link.
    const internalShareLink = window.location.href

    const clientConfig = useAppSelector(getClientConfig)

    // show external, "Publish" link only if this variable is true"
    const externalSharingEnabled = clientConfig.enablePublicSharedBoards

    // ToDo: update this later to use actual token
    const readToken = 'hardcoded-token'
    const shareUrl = new URL(window.location.toString())
    shareUrl.searchParams.set('r', readToken)

    return (
        <RootPortal>
            <Dialog
                className='shareBoardDialog'
                title='Share Board'
                onClose={props.onClose}
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
                    <TeamPermissionsRow />

                    {Object.values(members).map((member) => {
                        const user = boardUsers.find((user) => user.id === member.userId)
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
                                <div className='text-heading2'>{'Publish to the web'}</div>
                                <div className='text-light'>{'Publish and share a “read only” link with everyone on the web'}</div>
                            </div>
                            <div>
                                <Switch
                                    isOn={publicBoard}
                                    size='medium'
                                    onChanged={() => {
                                        setPublicBoard(!publicBoard)
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    {publicBoard &&
                     (<div className='d-flex tabs-inputs'>
                         <input
                             type='text'
                             className='mr-3'
                             value='https://focalboard-community.octo.mattermost'
                         />
                         <Button
                             emphasis='secondary'
                             size='medium'
                             onClick={() => {
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
        </RootPortal>
    )
}

export default ShareBoardDialog
