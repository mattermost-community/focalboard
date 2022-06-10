
// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl, FormattedMessage} from 'react-intl'

import {Board} from '../../../../webapp/src/blocks/board'
import Button from '../../../../webapp/src/widgets/buttons/button'

type Props = {
    item: Board
    currentChannel: string
    linkBoard: (board: Board) => void
    unlinkBoard: (board: Board) => void
}

const BoardSelectorItem = (props: Props) => {
    const {item, currentChannel} = props
    const intl = useIntl()
    const untitledBoardTitle = intl.formatMessage({id: 'ViewTitle.untitled-board', defaultMessage: 'Untitled Board'})
    const resultTitle = item.title || untitledBoardTitle
    return (
        <div
            className='blockSearchResult'
            style={{padding: '5px 0'}}
        >
            <span className='icon'>{item.icon}</span>
            <div
                className='resultLine'
                style={{flexGrow: 1, width: '80%', alignSelf: 'center'}}
            >
                <div
                    className='resultTitle'
                    style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {resultTitle}
                </div>
                <div
                    className='resultDescription'
                    style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        opacity: 0.7,
                    }}
                >
                    {item.description}
                </div>
            </div>
            <div
                className='linkUnlinkButton'
                style={{display: 'flex', alignSelf: 'center'}}
            >
                {item.channelId === currentChannel &&
                    <Button
                        onClick={() => props.unlinkBoard(item)}
                    >
                        <FormattedMessage 
                            id='boardSelector.unlink'
                            defaultMessage='Unlink'
                        />
                    </Button>}
                {item.channelId !== currentChannel &&
                    <Button
                        onClick={() => props.linkBoard(item)}
                        filled={true}
                    >
                        <FormattedMessage 
                            id='boardSelector.link'
                            defaultMessage='Link'
                        />
                    </Button>}
            </div>
        </div>
    )
}
export default BoardSelectorItem
