// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import ReactMarkdown from 'react-markdown'

const Avatar = (window as any).Components.Avatar
const Timestamp = (window as any).Components.Timestamp
const imageURLForUser = (window as any).Components.imageURLForUser

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
    const viewID = focalboardInformation.viewID
    const [card, setCard] = useState<{title?: string, type?: string, updateAt?: number, createdBy?: string, fields?: { icon: string, contentOrder: Array<string | string[]>, properties: {key?: string}}}>({})
    const [content, setContent] = useState<string>('')
    const [board, setBoard] = useState<{title?: string, fields?: { cardProperties: Array<unknown> }}>({})

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

    if (!Object.values(card).length || !Object.values(board).length) {
        return null
    }


    let remainder = 0
    const propertyKeyArray = Object.keys(card.fields?.properties || {})
    const propertyValueArray = Object.values(card.fields?.properties || {})
    const options = board.fields?.cardProperties
    const propertiesToDisplay = []

    // We will just display the first 3 properties and do a +n for remainder if any remainder
    if (propertyKeyArray.length > 0) {
        const numberOfLoops = propertyKeyArray.length > 3 ? 3 : propertyKeyArray.length
        remainder = propertyKeyArray.length - 3

        for (let i = 0; i < numberOfLoops; i++) {
            const keyToLookUp = propertyKeyArray[i]
            const correspondingOption = options?.find((option: any) => option.id === keyToLookUp) as any

            const valueToLookUp = Array.isArray(propertyValueArray[i]) ? propertyValueArray[i]![0] : propertyValueArray[i] as any
            const optionSelected = correspondingOption.options.find((option: any) => option.id === valueToLookUp)

            propertiesToDisplay.push({optionName: correspondingOption.name, optionValue: optionSelected.value, optionValueColour: optionSelected.color})
        }
    }

    const openCard = () => {
        window.open(
            `${baseURL}/boards/workspace/${workspaceID}/${boardID}/${viewID}?c=${blockID}`,
            '_blank',
        )
    }

    return (
        <div
            className='FocalboardUnfurl'
            onClick={openCard}
        >

            {/* Header of the Card*/}
            <div className='header'>
                <span className='icon'>{card.fields?.icon}</span>
                <div className='information'>
                    <span className='card_title'>{card.title}</span>
                    <span className='board_title'>{board.title}</span>
                </div>
            </div>

            {/* Body of the Card*/}
            {content !== '' &&
                <div className='body'>
                    <ReactMarkdown>
                        {content}
                    </ReactMarkdown>
                </div>
            }

            {/* Footer of the Card*/}
            <div className='footer'>
                <div className='avatar'>
                    <Avatar
                        size={'md'}
                        url={imageURLForUser(card.createdBy)}
                        className={'avatar-post-preview'}
                    />
                </div>
                <div className='timestamp_properties'>
                    <div className='properties'>
                        {propertiesToDisplay.map((property) => (
                            <div
                                key={property.optionValue}
                                className={`property ${property.optionValueColour}`}
                                title={`${property.optionName}`}
                            >
                                {property.optionValue}
                            </div>
                        ))}
                        {remainder > 0 && <span className='remainder'>{`+${remainder} more`} </span>}
                    </div>
                    <span className='post-preview__time'>
                        {card?.updateAt && 'Updated '}
                        {card?.updateAt &&
                            <Timestamp
                                value={card.updateAt}
                                units={[
                                    'now',
                                    'minute',
                                    'hour',
                                    'day',
                                ]}
                                useTime={false}
                                day={'numeric'}
                            />
                        }
                    </span>

                </div>

            </div>
        </div>
    )
}
