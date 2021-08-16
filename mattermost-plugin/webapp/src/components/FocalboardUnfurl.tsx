// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { stringify } from 'querystring';
import React, { useState, useEffect } from 'react';

type Props = {
    embed: {
        type: string,
        data: string,
    }
}

export const FocalboardUnfurl = async (props: Props) => {
    const focalboardInformation = JSON.parse(props.embed.data)
    const workspaceID = focalboardInformation.workspaceID
    const blockID = focalboardInformation.blockID
    const baseURL = focalboardInformation.baseURL
    const [block, setBlock] = useState<{title?: string, type?: string}>({})


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
        <div>
            {block && (
                <div>
                    {block?.title}
                    {block?.type}
                </div>
            )}
        </div>
    )
}