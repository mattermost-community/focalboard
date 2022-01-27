// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'
import {FormattedMessage} from 'react-intl'

import {Utils} from '../../utils'
import {useAppSelector} from '../../store/hooks'
import {IUser} from '../../user'
import {getWorkspaceUsersList} from '../../store/users'
import {getClientConfig} from '../../store/clientConfig'

import './shareBoard.scss'
import RootPortal from '../rootPortal'
import Dialog from '../dialog'
import Switch from '../../widgets/switch'
import Button from '../../widgets/buttons/button'

import SearchIcon from '../../widgets/icons/search'

import CompassIcon from '../../widgets/icons/compassIcon'

type Props = {
    onClose: () => void
}

const ShareBoardDialog = (props: Props): JSX.Element => {
    const [wasCopied, setWasCopied] = useState(false)
    const [publicBoard, setPublicBoard] = useState(false)

    // list of all users
    const workspaceUsers = useAppSelector<IUser[]>(getWorkspaceUsersList)

    // the "Share internally" link.
    const internalShareLink = window.location.href

    const clientConfig = useAppSelector(getClientConfig)

    // show external, "Publish" link only if this variable is true"
    const externalSharingEnabled = clientConfig.enablePublicSharedBoards

    // TODO update this later to use actual token
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
                {/* Todo: Make an autocomplete */}
                <div className='share-input__container'>
                    <div className='share-input'>
                        <SearchIcon/>
                        <input
                            type='text'
                            placeholder='Add people or groups'
                        />
                    </div>
                </div>

                <div className='user-items'>
                    <div className='user-item'>
                        <div className='user-item__content'>
                            <CompassIcon
                                icon='mattermost'
                                className='user-item__img'
                            />
                            <div className='ml-3'><strong>{'Everyone at Contributors Team'}</strong></div>
                        </div>
                        <div>
                            <button className='user-item__button'>
                                {'Editor'}
                                <CompassIcon
                                    icon='chevron-down'
                                    className='CompassIcon'
                                />
                            </button>
                        </div>
                    </div>
                    <div className='user-item'>
                        <div className='user-item__content'>
                            <img
                                src='https://randomuser.me/api/portraits/men/75.jpg'
                                className='user-item__img'
                            />
                            <div className='ml-3'>
                                <strong>{'Leonard Riley'}</strong>
                                <strong className='ml-2 text-light'>{'@leonard.riley'}</strong>
                                <strong className='ml-2 text-light'>{'(You)'}</strong>
                            </div>
                        </div>
                        <div>
                            <button className='user-item__button'>
                                {'Admin'}
                                <CompassIcon
                                    icon='chevron-down'
                                    className='CompassIcon'
                                />
                            </button>
                        </div>
                    </div>
                    <div className='user-item'>
                        <div className='user-item__content'>
                            <img
                                src='https://randomuser.me/api/portraits/men/61.jpg'
                                className='user-item__img'
                            />
                            <div className='ml-3'>
                                <strong>{'Ritthy Hoffman'}</strong>
                                <strong className='ml-2 text-light'>{'@ritthy.hoffman'}</strong>
                            </div>
                        </div>
                        <div>
                            <button className='user-item__button'>
                                {'Editor'}
                                <CompassIcon
                                    icon='chevron-down'
                                    className='CompassIcon'
                                />
                            </button>
                        </div>
                    </div>
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
