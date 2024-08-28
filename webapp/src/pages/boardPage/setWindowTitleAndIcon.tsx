// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {useEffect} from 'react'

import {Utils} from '../../utils'
import {getCurrentBoard} from '../../store/boards'
import {getCurrentView} from '../../store/views'
import {useAppSelector} from '../../store/hooks'

const SetWindowTitleAndIcon = (): null => {
    const board = useAppSelector(getCurrentBoard)
    const activeView = useAppSelector(getCurrentView)

    useEffect(() => {
        Utils.setFavicon(board?.icon)
    }, [board?.icon])

    useEffect(() => {
        if (board) {
            let title = `${board.title}`
            if (activeView?.title) {
                title += ` | ${activeView.title}`
            }
            document.title = title
        } else {
            document.title = 'Focalboard'
        }
    }, [board?.title, activeView?.title])

    return null
}

export default SetWindowTitleAndIcon
