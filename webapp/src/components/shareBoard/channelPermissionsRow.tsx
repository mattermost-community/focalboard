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

import PrivateIcon from '../../widgets/icons/lockOutline'
import PublicIcon from '../../widgets/icons/globe'
import DeleteIcon from '../../widgets/icons/delete'
import CompassIcon from '../../widgets/icons/compassIcon'

const ChannelPermissionsRow = (): JSX.Element => {
    const intl = useIntl()
    const board = useAppSelector(getCurrentBoard)
    const [linkedChannel, setLinkedChannel] = useState<Channel|null>(null)

    const onUnlinkBoard = async () => {
        const newBoard = createBoard(board)
        newBoard.channelId = ''
        mutator.updateBoard(newBoard, board, 'unlinked channel')
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

    return (
        <div className='user-item'>
            <div className='user-item__content'>
                <span className='user-item__img'>
                    {linkedChannel.type === 'P' && <PrivateIcon/>}
                    {linkedChannel.type === 'O' && <PublicIcon/>}
                </span>
                <div className='ml-3'><strong>{linkedChannel.display_name}</strong></div>
            </div>
            <div>
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
                            onClick={onUnlinkBoard}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
        </div>
    )
}

export default ChannelPermissionsRow
