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
import '../../../../../webapp/src/styles/labels.scss'

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
    const [loading, setLoading] = useState(true)

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
                setLoading(false)
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
                    setLoading(false)
                    return null
                }
                setContent(firstContentBlock)
            }

            setLoading(false)
            return null
        }
        fetchData()
    }, [originalPath])

    let remainder = 0
    let html = ''
    const propertiesToDisplay: Array<Record<string, string>> = []
    if (card && board) {
        // Checkboxes need to be accounted for if they are off or on, if they are on they show up in the card properties so we don't want to count it twice
        // Therefore we keep track how many checkboxes there are and subtract it at the end
        let totalNumberOfCheckBoxes = 0

        // We will just display the first 3 or less select/multi-select properties and do a +n for remainder if any remainder
        for (let i = 0; i < board.fields.cardProperties.length; i++) {
            const optionInBoard = board.fields.cardProperties[i]
            let valueToLookUp = card.fields.properties[optionInBoard.id]

            // Since these are always set and not included in the card properties
            if (['createdTime', 'createdBy', 'updatedTime', 'updatedBy', 'checkbox'].includes(optionInBoard.type)) {
                if (valueToLookUp && optionInBoard.type === 'checkbox') {
                    totalNumberOfCheckBoxes += 1
                }

                remainder += 1
                continue
            }

            // Check to see if this property is set in the Card or if we have max properties to display
            if (propertiesToDisplay.length === 3 || !valueToLookUp) {
                continue
            }

            if (Array.isArray(valueToLookUp)) {
                valueToLookUp = valueToLookUp[0]
            }

            const optionSelected = optionInBoard.options.find((option) => option.id === valueToLookUp)

            if (!optionSelected) {
                continue
            }

            propertiesToDisplay.push({optionName: optionInBoard.name, optionValue: optionSelected.value, optionValueColour: optionSelected.color})
        }
        remainder += (Object.keys(card.fields.properties).length - propertiesToDisplay.length - totalNumberOfCheckBoxes)
        html = Utils.htmlFromMarkdown(content?.title || '')
    }

    return (
        <IntlProvider
            messages={getMessages(locale)}
            locale={locale}
        >
            {!loading && (!card || !board) && <></>}
            {!loading && card && board &&
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
                                        style={{maxWidth: `${(1 / propertiesToDisplay.length) * 100}%`}}
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
            }
            {loading &&
                <div style={{height: '302px'}}/>
            }
        </IntlProvider>
    )
}

export default connect(mapStateToProps)(BoardsUnfurl)
