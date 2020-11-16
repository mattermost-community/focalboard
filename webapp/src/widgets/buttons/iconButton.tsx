// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './iconButton.scss'

type Props = {
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    title?: string
    icon?: React.ReactNode
}

export default class Button extends React.PureComponent<Props> {
    render(): JSX.Element {
        return (
            <div
                onClick={this.props.onClick}
                className='Button IconButton'
                title={this.props.title}
            >
                {this.props.icon}
            </div>
        )
    }
}
