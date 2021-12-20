// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'

import {useIntl} from 'react-intl'

import Search from '../../widgets/icons/search'

import './boardsSwitcher.scss'
import AddIcon from '../../widgets/icons/add'
import BoardSwitcherDialog from '../boardsSwitcherDialog/boardSwitcherDialog'

const BoardsSwitcher = (): JSX.Element => {
    const intl = useIntl()

    const [showSwitcher, setShowSwitcher] = useState<boolean>(false)

    // Disabling this for now as Cmd+K
    // is being used by Firefox for activating
    // Search Bar. Unable to prevent browser default right now.
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
            <span className='add-workspace-icon'>
                <AddIcon/>
            </span>

            {
                showSwitcher &&
                <BoardSwitcherDialog onClose={() => setShowSwitcher(false)}/>
            }
        </div>
    )
}

export default BoardsSwitcher
