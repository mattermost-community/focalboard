// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './button.scss'

type Props = {
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    style?: React.CSSProperties
    backgroundColor?: string
    children?: React.ReactNode
    title?: string
}

export default class Button extends React.Component<Props> {
    render() {
        const style = {...this.props.style, backgroundColor: this.props.backgroundColor}
        return (
            <div
                onClick={this.props.onClick}
                className='Button octo-button'
                style={style}
                title={this.props.title}
            >
                {this.props.children}
            </div>)
    }
}
