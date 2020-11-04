// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {MenuOptionProps} from './menuItem'

type TextOptionProps = MenuOptionProps & {
    icon?: React.ReactNode,
    rightIcon?: React.ReactNode,
}

export default class TextOption extends React.PureComponent<TextOptionProps> {
    private handleOnClick = (): void => {
        this.props.onClick(this.props.id)
    }

    public render(): JSX.Element {
        const {name, icon, rightIcon} = this.props
        return (
            <div
                className='MenuOption TextOption menu-option'
                onClick={this.handleOnClick}
            >
                {icon}
                <div className='menu-name'>{name}</div>
                {rightIcon}
            </div>
        )
    }
}
