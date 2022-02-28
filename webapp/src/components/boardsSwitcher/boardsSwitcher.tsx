// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import {useIntl} from 'react-intl'

import Search from '../../widgets/icons/search'

import './boardsSwitcher.scss'
import AddIcon from '../../widgets/icons/add'
import BoardSwitcherDialog from '../boardsSwitcherDialog/boardSwitcherDialog'
import {Utils} from '../../utils'
import {Constants} from '../../constants'

type Props = {
    onBoardTemplateSelectorOpen?: () => void,
}

const BoardsSwitcher = (props: Props): JSX.Element => {
    const intl = useIntl()

    const [showSwitcher, setShowSwitcher] = useState<boolean>(false)

    const handleQuickSwitchKeyPress = (e: KeyboardEvent) => {
        if (Utils.cmdOrCtrlPressed(e) && !e.shiftKey && Utils.isKeyPressed(e, Constants.keyCodes.K)) {
            if (!e.altKey) {
                e.preventDefault()
                setShowSwitcher((show) => !show)
            }
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', handleQuickSwitchKeyPress)

        // cleanup function
        return () => {
            document.removeEventListener('keydown', handleQuickSwitchKeyPress)
        }
    }, [])

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
                    onClick={props.onBoardTemplateSelectorOpen}
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
