// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {MenuOptionProps} from './menuItem'

type TextOptionProps = MenuOptionProps & {
    icon?: 'checked' | 'sortUp' | 'sortDown' | undefined,
}

export default class TextOption extends React.PureComponent<TextOptionProps> {
    private handleOnClick = (): void => {
        this.props.onClick(this.props.id)
    }

    public render(): JSX.Element {
        const {name, icon} = this.props
        return (
            <div
                className='MenuOption TextOption menu-option'
                onClick={this.handleOnClick}
            >
                <div className='menu-name'>{name}</div>
                {icon && <div className={`icon ${icon}`}/>}
            </div>
        )
    }
}
