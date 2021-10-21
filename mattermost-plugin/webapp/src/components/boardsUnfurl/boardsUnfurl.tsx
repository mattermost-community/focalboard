// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {IntlProvider, FormattedMessage} from 'react-intl'
import {connect} from 'react-redux'

import {GlobalState} from 'mattermost-redux/types/store'
import {getCurrentUserLocale} from 'mattermost-redux/selectors/entities/i18n'

import {getMessages} from './../../../../../webapp/src/i18n'
import {Utils} from './../../../../../webapp/src/utils'
import {Card} from './../../../../../webapp/src/blocks/card'
import {Board} from './../../../../../webapp/src/blocks/board'
import {ContentBlock} from './../../../../../webapp/src/blocks/contentBlock'
import octoClient from './../../../../../webapp/src/octoClient'

const Avatar = (window as any).Components.Avatar
const Timestamp = (window as any).Components.Timestamp
const imageURLForUser = (window as any).Components.imageURLForUser

import './boardsUnfurl.scss'

type Props = {
    embed: {
        data: string,
    },
    locale: string,
}

function mapStateToProps(state: GlobalState) {
    const locale = getCurrentUserLocale(state)

    return {
        locale,
    }
}

const BoardsUnfurl = (props: Props): JSX.Element => {
    if (!props.embed || !props.embed.data) {
        return <></>
    }

    const {embed, locale} = props
    const focalboardInformation = JSON.parse(embed.data)
    const {workspaceID, cardID, boardID, readToken, originalPath} = focalboardInformation
    const baseURL = window.location.origin

    if (!workspaceID || !cardID || !boardID) {
        return <></>
    }

    const [card, setCard] = useState<Card>()
    const [content, setContent] = useState<ContentBlock>()
    const [board, setBoard] = useState<Board>()

    useEffect(() => {
        const fetchData = async () => {
            const [cards, boards] = await Promise.all(
                [
                    octoClient.getBlocksWithBlockID(cardID, workspaceID, readToken),
                    octoClient.getBlocksWithBlockID(boardID, workspaceID, readToken),
                ],
            )
            const [firstCard] = cards as Card[]
            const [firstBoard] = boards as Board[]
            if (!firstCard || !firstBoard) {
                return null
            }
            setCard(firstCard)
            setBoard(firstBoard)

            if (firstCard.fields.contentOrder.length) {
                let [firstContentBlockID] = firstCard.fields?.contentOrder

                if (Array.isArray(firstContentBlockID)) {
                    [firstContentBlockID] = firstContentBlockID
                }

                const contentBlock = await octoClient.getBlocksWithBlockID(firstContentBlockID, workspaceID, readToken) as ContentBlock[]
                const [firstContentBlock] = contentBlock
                if (!firstContentBlock) {
                    return null
                }
                setContent(firstContentBlock)
            }

            return null
        }
        fetchData()
    }, [originalPath])

    if (!card || !board) {
        return <></>
    }

    const propertyKeyArray = Object.keys(card.fields.properties)
    const propertyValueArray = Object.values(card.fields.properties)
    const options = board.fields.cardProperties
    const propertiesToDisplay: Array<Record<string, string>> = []

    // We will just display the first 3 or less select/multi-select properties and do a +n for remainder if any remainder
    if (propertyKeyArray.length > 0) {
        for (let i = 0; i < propertyKeyArray.length && propertiesToDisplay.length < 3; i++) {
            const keyToLookUp = propertyKeyArray[i]
            const correspondingOption = options.find((option) => option.id === keyToLookUp)

            if (!correspondingOption) {
                continue
            }

            let valueToLookUp = propertyValueArray[i]
            if (Array.isArray(valueToLookUp)) {
                valueToLookUp = valueToLookUp[0]
            }

            const optionSelected = correspondingOption.options.find((option) => option.id === valueToLookUp)

            if (!optionSelected) {
                continue
            }

            propertiesToDisplay.push({optionName: correspondingOption.name, optionValue: optionSelected.value, optionValueColour: optionSelected.color})
        }
    }
    const remainder = propertyKeyArray.length - propertiesToDisplay.length
    const html: string = Utils.htmlFromMarkdown(content?.title || '')
    return (
        <IntlProvider
            messages={getMessages(locale)}
            locale={locale}
        >
            <a
                className='FocalboardUnfurl'
                href={`${baseURL}${originalPath}`}
                rel='noopener noreferrer'
                target='_blank'
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
                {html !== '' &&
                    <div className='body'>
                        <div
                            dangerouslySetInnerHTML={{__html: html}}
                        />
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
                            {remainder > 0 &&
                                <span className='remainder'>
                                    <FormattedMessage
                                        id='BoardsUnfurl.Remainder'
                                        defaultMessage='+{remainder} more'
                                        values={{
                                            remainder,
                                        }}
                                    />
                                </span>
                            }
                        </div>
                        <span className='post-preview__time'>
                            <FormattedMessage
                                id='BoardsUnfurl.Updated'
                                defaultMessage='Updated {time}'
                                values={{
                                    time: (
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
                                    ),
                                }}
                            />
                        </span>
                    </div>
                </div>
            </a>
        </IntlProvider>
    )
}

export default connect(mapStateToProps)(BoardsUnfurl)
