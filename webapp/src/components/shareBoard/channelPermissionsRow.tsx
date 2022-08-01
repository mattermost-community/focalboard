// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useEffect} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'

import MenuWrapper from '../../widgets/menuWrapper'
import Menu from '../../widgets/menu'

import {createBoard} from '../../blocks/board'
import {useAppSelector} from '../../store/hooks'
import {getCurrentBoard} from '../../store/boards'
import {Channel} from '../../store/channels'
import {Utils} from '../../utils'
import mutator from '../../mutator'
import octoClient from '../../octoClient'
import {Permission} from '../../constants'

import PrivateIcon from '../../widgets/icons/lockOutline'
import PublicIcon from '../../widgets/icons/globe'
import DeleteIcon from '../../widgets/icons/delete'
import CompassIcon from '../../widgets/icons/compassIcon'
import ConfirmationDialogBox from "../confirmationDialogBox"

import BoardPermissionGate from '../permissions/boardPermissionGate'

const ChannelPermissionsRow = (): JSX.Element => {
    const intl = useIntl()
    const board = useAppSelector(getCurrentBoard)
    const [linkedChannel, setLinkedChannel] = useState<Channel|null>(null)
    const [showUnlinkChannelConfirmation, setShowUnlinkChannelConfirmation] = useState<boolean>(false)

    const onUnlinkBoard = async () => {
        const newBoard = createBoard(board)
        newBoard.channelId = ''
        mutator.updateBoard(newBoard, board, 'unlinked channel')
        setShowUnlinkChannelConfirmation(false)
    }

    useEffect(() => {
        if (!Utils.isFocalboardPlugin() || !board.channelId) {
            setLinkedChannel(null)
            return
        }
        octoClient.getChannel(board.teamId, board.channelId).then((c) => setLinkedChannel(c || null))
    }, [board.channelId])

    if (!linkedChannel) {
        return <></>
    }

    const confirmationDialog = (
        <ConfirmationDialogBox
            dialogBox={{
                heading: intl.formatMessage({
                    id: 'shareBoard.confirm-unlink.title',
                    defaultMessage: 'Unlink channel from board',
                }),
                subText: intl.formatMessage({
                    id: 'shareBoard.confirm-unlink.body',
                    defaultMessage: 'When you unlink a channel from a board, all members of the channel (existing and new) will loose access to it unless they are given permission separately. {lineBreak} Are you sure you want to unlink it?',
                }, {
                    lineBreak: <p/>
                }),
                confirmButtonText: intl.formatMessage({
                    id: 'shareBoard.confirm-unlink.confirmBtnText',
                    defaultMessage: 'Yes, unlink',
                }),
                onConfirm: onUnlinkBoard,
                onClose: () => setShowUnlinkChannelConfirmation(false),
            }}
        />
    )

    return (
        <div className='user-item channel-item'>
            {showUnlinkChannelConfirmation && confirmationDialog}
            <div className='user-item__content'>
                <span className='user-item__img'>
                    {linkedChannel.type === 'P' && <PrivateIcon/>}
                    {linkedChannel.type === 'O' && <PublicIcon/>}
                </span>
                <div className='ml-3'><strong>{linkedChannel.display_name}</strong></div>
            </div>
            <div>
                <BoardPermissionGate permissions={[Permission.ManageBoardRoles]}>
                    <MenuWrapper>
                        <button className='user-item__button'>
                            <FormattedMessage
                                id='BoardMember.schemeEditor'
                                defaultMessage='Editor'
                            />
                            <CompassIcon
                                icon='chevron-down'
                                className='CompassIcon'
                            />
                        </button>
                        <Menu position='left'>
                            <Menu.Text
                                id='Unlink'
                                icon={<DeleteIcon/>}
                                name={intl.formatMessage({id: 'BoardMember.unlinkChannel', defaultMessage: 'Unlink'})}
                                onClick={() => setShowUnlinkChannelConfirmation(true)}
                            />
                        </Menu>
                    </MenuWrapper>
                </BoardPermissionGate>
                <BoardPermissionGate
                    permissions={[Permission.ManageBoardRoles]}
                    invert={true}
                >
                    <FormattedMessage
                        id='BoardMember.schemeEditor'
                        defaultMessage='Editor'
                    />
                </BoardPermissionGate>
            </div>
        </div>
    )
}

export default ChannelPermissionsRow
