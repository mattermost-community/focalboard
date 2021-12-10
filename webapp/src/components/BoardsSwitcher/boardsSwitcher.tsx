// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {useIntl} from 'react-intl'

import Search from '../../widgets/icons/search'

import './boardsSwitcher.scss'
import AddIcon from '../../widgets/icons/add'

const BoardsSwitcher = ():JSX.Element => {
    const intl = useIntl()

    return (
        <div className='BoardsSwitcherWrapper'>
            <div className='BoardsSwitcher'>
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
        </div>
    )
}

export default BoardsSwitcher
