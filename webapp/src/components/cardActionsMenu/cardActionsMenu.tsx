// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactNode} from 'react'
import {useIntl} from 'react-intl'

import DeleteIcon from '../../widgets/icons/delete'
import Menu from '../../widgets/menu'
import BoardPermissionGate from '../permissions/boardPermissionGate'
import DuplicateIcon from '../../widgets/icons/duplicate'
import LinkIcon from '../../widgets/icons/Link'
import {Utils} from '../../utils'
import {Permission} from '../../constants'
import {sendFlashMessage} from '../flashMessages'
import {IUser} from '../../user'
import {getMe} from '../../store/users'
import {useAppSelector} from '../../store/hooks'

type Props = {
    cardId: string
    onClickDelete: () => void
    onClickDuplicate?: () => void
    children?: ReactNode
}

export const CardActionsMenu = (props: Props): JSX.Element => {
    const {cardId} = props

    const me = useAppSelector<IUser|null>(getMe)
    const intl = useIntl()

    return (
        <Menu position='left'>
            <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
                <Menu.Text
                    icon={<DeleteIcon/>}
                    id='delete'
                    name={intl.formatMessage({id: 'CardActionsMenu.delete', defaultMessage: 'Delete'})}
                    onClick={props.onClickDelete}
                />
                {props.onClickDuplicate &&
                <Menu.Text
                    icon={<DuplicateIcon/>}
                    id='duplicate'
                    name={intl.formatMessage({id: 'CardActionsMenu.duplicate', defaultMessage: 'Duplicate'})}
                    onClick={props.onClickDuplicate}
                />}
            </BoardPermissionGate>
            {me?.id !== 'single-user' &&
                <Menu.Text
                    icon={<LinkIcon/>}
                    id='copy'
                    name={intl.formatMessage({id: 'CardActionsMenu.copyLink', defaultMessage: 'Copy link'})}
                    onClick={() => {
                        let cardLink = window.location.href

                        if (!cardLink.includes(cardId)) {
                            cardLink += `/${cardId}`
                        }

                        Utils.copyTextToClipboard(cardLink)
                        sendFlashMessage({content: intl.formatMessage({id: 'CardActionsMenu.copiedLink', defaultMessage: 'Copied!'}), severity: 'high'})
                    }}
                />
            }
            {props.children}
        </Menu>
    )
}

export default CardActionsMenu
