// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {useIntl} from 'react-intl'

import {Utils} from '../utils'

import {Permission} from '../constants'
import IconButton from '../widgets/buttons/iconButton'
import DeleteIcon from '../widgets/icons/delete'
import AddIcon from '../widgets/icons/add'
import LinkIcon from '../widgets/icons/Link'
import DuplicateIcon from '../widgets/icons/duplicate'
import OptionsIcon from '../widgets/icons/options'
import MenuWrapper from '../widgets/menuWrapper'
import Menu from '../widgets/menu'

import {sendFlashMessage} from './flashMessages'
import BoardPermissionGate from './permissions/boardPermissionGate'

type Props = {
    pageId: string
    onClickDelete: () => void
    onClickDuplicate: () => void
    onClickAddSubpage: () => void
}

const PageMenu = (props: Props) => {
    const intl = useIntl()
    const {pageId} = props

    return (
        <div className='PageMenu'>
            <MenuWrapper>
                <IconButton
                    size='medium'
                    icon={<OptionsIcon/>}
                />
                <Menu position='left'>
                    <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
                        <Menu.Text
                            icon={<AddIcon/>}
                            id='add'
                            name={intl.formatMessage({id: 'PageActionsMenu.add-subpage', defaultMessage: 'Add subpage'})}
                            onClick={props.onClickAddSubpage}
                        />
                        <Menu.Text
                            icon={<DeleteIcon/>}
                            id='delete'
                            name={intl.formatMessage({id: 'PageActionsMenu.delete', defaultMessage: 'Delete'})}
                            onClick={props.onClickDelete}
                        />
                        {props.onClickDuplicate &&
                        <Menu.Text
                            icon={<DuplicateIcon/>}
                            id='duplicate'
                            name={intl.formatMessage({id: 'PageActionsMenu.duplicate', defaultMessage: 'Duplicate'})}
                            onClick={props.onClickDuplicate}
                        />}
                    </BoardPermissionGate>
                    <Menu.Text
                        icon={<LinkIcon/>}
                        id='copy'
                        name={intl.formatMessage({id: 'PageActionsMenu.copyLink', defaultMessage: 'Copy link'})}
                        onClick={() => {
                            let pageLink = window.location.href

                            if (!pageLink.includes(pageId)) {
                                pageLink += `/${pageId}`
                            }

                            Utils.copyTextToClipboard(pageLink)
                            sendFlashMessage({content: intl.formatMessage({id: 'PageActionsMenu.copiedLink', defaultMessage: 'Copied!'}), severity: 'high'})
                        }}
                    />
                </Menu>
            </MenuWrapper>
        </div>
    )
}

export default React.memo(PageMenu)
