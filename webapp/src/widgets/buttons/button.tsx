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
    submit?: boolean
    emphasis?: string
    size?: string
}

function Button(props: Props): JSX.Element {
    return (
        <button
            type={props.submit ? 'submit' : 'button'}
            onClick={props.onClick}
            className={`Button ${props.active ? 'active' : ''} ${props.filled ? 'filled' : ''} ${props.emphasis ? 'emphasis--' + props.emphasis : ''} ${props.size ? 'size--' + props.size : ''}`}
            title={props.title}
        >
            {props.icon}
            <span>{props.children}</span>
        </button>)
}

export default React.memo(Button)
