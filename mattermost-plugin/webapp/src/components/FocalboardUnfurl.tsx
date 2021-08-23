// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'

import PostAttachmentContainer from './shared/post_attachment_container'

import './FocalboardUnfurl.scss'

type Props = {
    embed: {
        type: string,
        data: string,
    }
}

export const FocalboardUnfurl = (props: Props) => {
    const focalboardInformation = JSON.parse(props.embed.data)
    const workspaceID = focalboardInformation.workspaceID
    const blockID = focalboardInformation.blockID
    const baseURL = focalboardInformation.baseURL
    const [block, setBlock] = useState<{title?: string, type?: string, fields?: { icon: string }}>({})


    if (!workspaceID || !blockID || !baseURL) {
        return null
    }

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`${baseURL}/plugins/focalboard/api/v1/workspaces/${workspaceID}/blocks/${blockID}/subtree?l=0`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
            if (!response.ok) {
                return null
            }
            const blocks = await response.json()
            if (!blocks.length) {
                return null
            }
            setBlock(blocks[0])
            return null
        }

        fetchData()
    }, [])

    return (
        <PostAttachmentContainer
            className='FocalboardUnfurl'
            link='google.com'
        >
            <div className='FocalboardUnfurl'>
                <div className='header'>
                    {block.fields?.icon}
                    {block.title}
                    {block.type}
                </div>
            </div>
        </PostAttachmentContainer>
    )
}
