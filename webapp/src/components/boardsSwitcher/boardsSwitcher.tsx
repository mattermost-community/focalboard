// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {useIntl} from 'react-intl'

import {useHistory} from 'react-router-dom'

import Search from '../../widgets/icons/search'

import './boardsSwitcher.scss'
import AddIcon from '../../widgets/icons/add'
import BoardSwitcherDialog from '../boardsSwitcherDialog/boardSwitcherDialog'
import {UserSettings} from '../../userSettings'
import {setCurrent as setCurrentBoard} from '../../store/boards'
import {setCurrent as setCurrentView} from '../../store/views'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {Utils} from '../../utils'
import {getCurrentTeam} from '../../store/teams'

const BoardsSwitcher = (): JSX.Element => {
    const intl = useIntl()
    const team = useAppSelector(getCurrentTeam)

    const [showSwitcher, setShowSwitcher] = useState<boolean>(false)

    // Disabling this for now as Cmd+K
    // is being used by Firefox for activating
    // Search Bar. Unable to prevent browser default right now.
    // It doesn't work when the search input has the focus.
    //
    // useHotkeys('ctrl+k,cmd+k',
    //     (e) => {
    //         e.preventDefault()
    //         setShowSwitcher((show) => !show)
    //     },
    //     {
    //         filter: () => {
    //             console.log('filter called')
    //             return true
    //         },
    //         enableOnTags: ['INPUT'],
    //         filterPreventDefault: true,
    //     },
    //     [showSwitcher],
    // )

    const dispatch = useAppDispatch()
    const history = useHistory()

    const goToEmptyCenterPanel = () => {
        UserSettings.setLastBoardID(team?.id || '', '')

        // TODO see if this works or do we need a solution
        dispatch(setCurrentBoard(''))
        dispatch(setCurrentView(''))
        history.replace(`/team/${team?.id}`)
    }

    return (
        <div className='BoardsSwitcherWrapper'>
            <div
                className='BoardsSwitcher'
                onClick={() => setShowSwitcher(true)}
            >
                <Search/>
                <div>
                    <span>
                        {intl.formatMessage({id: 'BoardsSwitcher.Title', defaultMessage: 'Find Boards'})}
                    </span>
                </div>
            </div>

            {
                Utils.isFocalboardPlugin() &&
                <span
                    className='add-board-icon'
                    onClick={goToEmptyCenterPanel}
                >
                    <AddIcon/>
                </span>
            }

            {
                showSwitcher &&
                <BoardSwitcherDialog onClose={() => setShowSwitcher(false)}/>
            }
        </div>
    )
}

export default BoardsSwitcher
