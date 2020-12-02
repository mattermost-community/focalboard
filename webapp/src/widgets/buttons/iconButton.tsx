// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './iconButton.scss'

type Props = {
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    title?: string
    icon?: React.ReactNode
    className?: string
}

export default class IconButton extends React.PureComponent<Props> {
    render(): JSX.Element {
        let className = 'Button IconButton'
        if (this.props.className) {
            className += ' ' + this.props.className
        }
        return (
            <div
                onClick={this.props.onClick}
                className={className}
                title={this.props.title}
            >
                {this.props.icon}
            </div>
        )
    }
}
