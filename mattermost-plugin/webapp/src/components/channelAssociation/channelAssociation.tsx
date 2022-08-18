// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Post} from 'mattermost-redux/types/posts'

const PostTypeChannelAssociation = (props: {post: Post}): JSX.Element => {

    const boardTitle = props.post.props.boardTitle
    return (
        <div className='PostTypeChannelAssociation'>
            <a>{boardTitle}</a>
            <span>{props.post.message}</span>
        </div>
    )
}

export default PostTypeChannelAssociation
