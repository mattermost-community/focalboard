// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Post} from 'mattermost-redux/types/posts'

const PostTypeChannelAssociation = (props: {post: Post}): JSX.Element => {

    return (
        <div className='PostTypeChannelAssociation'>
            <span>{props.post.message}</span>
        </div>
    )
}

export default PostTypeChannelAssociation
