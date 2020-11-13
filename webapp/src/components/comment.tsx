// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {FC} from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IBlock} from '../blocks/block'
import mutator from '../mutator'
import {Utils} from '../utils'
import IconButton from '../widgets/buttons/iconButton'
import DeleteIcon from '../widgets/icons/delete'
import OptionsIcon from '../widgets/icons/options'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import './comment.scss'

type Props = {
    comment: IBlock
    username: string
    userImageUrl: string
    intl: IntlShape
}

const Comment: FC<Props> = (props: Props) => {
    const {comment, username, userImageUrl, intl} = props
    const html = Utils.htmlFromMarkdown(comment.title)
    return (
        <div
            key={comment.id}
            className='Comment comment'
        >
            <div className='comment-header'>
                <img
                    className='comment-avatar'
                    src={userImageUrl}
                />
                <div className='comment-username'>{username}</div>
                <div className='comment-date'>{(new Date(comment.createAt)).toLocaleTimeString()}</div>
                <MenuWrapper>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            icon={<DeleteIcon/>}
                            id='delete'
                            name={intl.formatMessage({id: 'Comment.delete', defaultMessage: 'Delete'})}
                            onClick={() => mutator.deleteBlock(comment)}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
            <div
                className='comment-text'
                dangerouslySetInnerHTML={{__html: html}}
            />
        </div>
    )
}

export default injectIntl(Comment)
