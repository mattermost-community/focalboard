// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {useHistory, useRouteMatch} from 'react-router-dom'

import NoPagesPNG from '../../static/noPages.png'
import Button from '../widgets/buttons/button'
import mutator from '../mutator'
import {getCurrentBoardId} from '../store/boards'
import {getCurrentTeam, Team} from '../store/teams'
import {useAppSelector} from '../store/hooks'

import './noPages.scss'
import {IUser} from '../user'
import {getMe} from '../store/users'

import {Utils} from '../utils'

const NoPages = () => {
    const currentBoardId = useAppSelector<string>(getCurrentBoardId) || null
    const currentTeam = useAppSelector<Team|null>(getCurrentTeam)
    const intl = useIntl()
    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId?: string}>()
    const me = useAppSelector<IUser|null>(getMe)

    const showBoard = useCallback(async (boardId) => {
        Utils.showBoard(boardId, match, history)
    }, [match, history])

    return (
        <div className='NoPages'>
            <div className='header'>
                <img
                    src={Utils.buildURL(NoPagesPNG, true)}
                    className='noPagesImage'
                    alt='No Pages Image'
                />
                <h1 className='title text-heading6'>
                    <FormattedMessage
                        id='NoPages.title'
                        defaultMessage='No pages yet'
                    />
                </h1>
                <p className='description text-base'>
                    {!me?.is_guest &&
                        <FormattedMessage
                            id='NoPages.description'
                            defaultMessage='You are not member of any pages yet, you can start creating your own page, or ask somebody to add you to an existing one.'
                        />}
                    {me?.is_guest &&
                        <FormattedMessage
                            id='NoPages.description-guest'
                            defaultMessage='You are not member of any pages yet, please ask somebody to add you to an existing one.'
                        />}
                </p>
            </div>
            {!me?.is_guest &&
                <div className='buttons'>
                    <Button
                        filled={true}
                        size={'large'}
                        onClick={async () => {
                            await mutator.addEmptyFolder(currentTeam?.id || '0', intl, showBoard, () => showBoard(currentBoardId))
                        }}
                    >
                        <FormattedMessage
                            id='NoPages.create-empty-page'
                            defaultMessage='Create new page'
                        />
                    </Button>
                </div>}
        </div>
    )
}

export default React.memo(NoPages)
