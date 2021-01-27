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

export default class Button extends React.PureComponent<Props> {
    render(): JSX.Element {
        return (
            <button
                type='button'
                onClick={this.props.onClick}
                className={`Button ${this.props.active ? 'active' : ''} ${this.props.filled ? 'filled' : ''}`}
                title={this.props.title}
            >
                {this.props.icon}
                {this.props.children}
            </button>)
    }
}
