// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import button from './button'

import './iconButton.scss'

type Props = {
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    title?: string
    icon?: React.ReactNode
    className?: string
    onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void
}

function IconButton(props: Props): JSX.Element {
    let className = 'Button IconButton'
    if (props.className) {
        className += ' ' + props.className
    }
    return (
        <button
            role='button'
            onClick={props.onClick}
            onMouseDown={props.onMouseDown}
            className={className}
            title={props.title}
            aria-label={props.title}
        >
            {props.icon}
        </button>
    )
}

export default React.memo(IconButton)
