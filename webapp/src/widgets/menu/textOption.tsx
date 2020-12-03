// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {MenuOptionProps} from './menuItem'

type TextOptionProps = MenuOptionProps & {
    icon?: React.ReactNode,
    rightIcon?: React.ReactNode,
    className?: string
}

export default class TextOption extends React.PureComponent<TextOptionProps> {
    private handleOnClick = (e: React.MouseEvent): void => {
        e.target.dispatchEvent(new Event('menuItemClicked'))
        this.props.onClick(this.props.id)
    }

    public render(): JSX.Element {
        const {name, icon, rightIcon} = this.props
        let className = 'MenuOption TextOption menu-option'
        if (this.props.className) {
            className += ' ' + this.props.className
        }
        return (
            <div
                className={className}
                onClick={this.handleOnClick}
            >
                {icon ?? <div className='noicon'/>}
                <div className='menu-name'>{name}</div>
                {rightIcon ?? <div className='noicon'/>}
            </div>
        )
    }
}
