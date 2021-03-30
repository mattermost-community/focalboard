// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './button.scss'

type Props = {
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
    children?: React.ReactNode
    title?: string
    icon?: React.ReactNode
    filled?: boolean
    active?: boolean
}

function Button(props: Props): JSX.Element {
    return (
        <button
            type='button'
            onClick={props.onClick}
            className={`Button ${props.active ? 'active' : ''} ${props.filled ? 'filled' : ''}`}
            title={props.title}
        >
            {props.icon}
            {props.children}
        </button>)
}

export default React.memo(Button)
