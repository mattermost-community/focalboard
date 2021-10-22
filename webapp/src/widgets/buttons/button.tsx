// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './button.scss'
import {Utils} from '../../utils'

type Props = {
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLButtonElement>) => void
    children?: React.ReactNode
    title?: string
    icon?: React.ReactNode
    filled?: boolean
    active?: boolean
    submit?: boolean
    emphasis?: string
    size?: string
    className?: string
}

function Button(props: Props): JSX.Element {
    const classNames: Record<string, boolean> = {
        Button: true,
        active: Boolean(props.active),
        filled: Boolean(props.filled),
    }
    classNames[`emphasis--${props.emphasis}`] = Boolean(props.emphasis)
    classNames[`size--${props.size}`] = Boolean(props.size)
    classNames[`${props.className}`] = Boolean(props.className)

    return (
        <button
            type={props.submit ? 'submit' : 'button'}
            onClick={props.onClick}
            className={Utils.generateClassName(classNames)}
            title={props.title}
            onBlur={props.onBlur}
        >
            {props.icon}
            <span>{props.children}</span>
        </button>)
}

export default React.memo(Button)
