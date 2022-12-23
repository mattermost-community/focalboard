// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import IconButton from '../../widgets/buttons/iconButton'
import CompassIcon from '../../widgets/icons/compassIcon'

import './formattingMenu.scss'

const FormattingMenu = () => {
    return (
        <div className='FormattingMenu'>
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-header-1'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-header-2'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-header-3'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-header-4'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-header-5'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-header-6'/>}
            />
            <span className='divider'/>
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-bold'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-italic'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-strikethrough-variant'/>}
            />
            <span className='divider'/>
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='link-variant'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='code-tags'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='code-block'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-quote-open'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-list-bulleted'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='format-list-numbered'/>}
            />
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='table-plus'/>}
            />
            <span className='divider'/>
            <IconButton
                size='small'
                onClick={() => 'TODO'}
                icon={<CompassIcon icon='plus'/>}
            />
        </div>
    )
}

export default React.memo(FormattingMenu)
