// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'
import {FormattedMessage} from 'react-intl'

import Button from '../../widgets/buttons/button'
import DeleteIcon from '../../widgets/icons/delete'

import './shareBoardButton.scss'

import ShareBoardDialog from './shareBoard'

const ShareBoardButton = React.memo(() => {
    const [showShareDialog, setShowShareDialog] = useState(false)

    return (
        <div className='button-head'>
            <Button
                title='Share board'
                size='medium'
                emphasis='tertiary'
                icon={<DeleteIcon/>}
                onClick={() => setShowShareDialog(!showShareDialog)}
            >
                <FormattedMessage
                    id='CenterPanel.Share'
                    defaultMessage='Share'
                />
            </Button>
            {showShareDialog && <ShareBoardDialog onClose={() => setShowShareDialog(false)}/>}
        </div>
    )
})

export default ShareBoardButton
