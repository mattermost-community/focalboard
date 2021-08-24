// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import ReactMarkdown from 'react-markdown'

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
    const boardID = focalboardInformation.boardID
    const [card, setCard] = useState<{title?: string, type?: string, fields?: { icon: string, contentOrder: Array<string | string[]> }}>({})
    const [content, setContent] = useState<string>('')
    const [board, setBoard] = useState<{title?: string}>({})

    if (!workspaceID || !blockID || !baseURL) {
        return null
    }

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`${baseURL}/plugins/focalboard/api/v1/workspaces/${workspaceID}/blocks?block_id=${blockID}`, {
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
            setCard(blocks[0])

            console.log(blocks[0].fields?.contentOrder)
            if (blocks[0].fields?.contentOrder.length > 0) {
                let contentID = blocks[0].fields?.contentOrder[0]
                if (Array.isArray(blocks[0].fields?.contentOrder[0])) {
                    contentID = blocks[0].fields?.contentOrder[0][0]
                }

                const contentResponse = await fetch(`${baseURL}/plugins/focalboard/api/v1/workspaces/${workspaceID}/blocks?block_id=${contentID}`, {
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                })
                if (!contentResponse.ok) {
                    return null
                }
                const contentJSON = await contentResponse.json()
                if (!contentJSON.length) {
                    return null
                }
                setContent(contentJSON[0].title)
            }

            return null
        }

        fetchData()
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`${baseURL}/plugins/focalboard/api/v1/workspaces/${workspaceID}/blocks?block_id=${boardID}`, {
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
            setBoard(blocks[0])
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

                {/* Header of the Card*/}
                <div className='header'>
                    <span className='icon'>{card.fields?.icon}</span>
                    <div className='information'>
                        <span className='card_title'>{card.title}</span>
                        <span className='board_title'>{board.title}</span>
                    </div>
                </div>

                {/* Body of the Card*/}
                <div className='body'>
                    <div className='gallery-item'>
                        <ReactMarkdown>
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>

            </div>
        </PostAttachmentContainer>
    )
}
