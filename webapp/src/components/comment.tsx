// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {FC} from 'react'
import {IntlShape, injectIntl} from 'react-intl'

import mutator from '../mutator'
import {IBlock} from '../blocks/block'

import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import './comment.scss'
import {Utils} from '../utils'

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
                    <div className='octo-hoverbutton square'>{'...'}</div>
                    <Menu>
                        <Menu.Text
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
