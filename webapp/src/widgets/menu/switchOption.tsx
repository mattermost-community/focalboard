// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import Switch from '../switch'

import {MenuOptionProps} from './menuItem'

type SwitchOptionProps = MenuOptionProps & {
    isOn: boolean,
    icon?: 'checked' | 'sortUp' | 'sortDown' | undefined,
}

export default class SwitchOption extends React.PureComponent<SwitchOptionProps> {
    private handleOnClick = (): void => {
        this.props.onClick(this.props.id)
    }

    public render(): JSX.Element {
        const {name, icon, isOn} = this.props
        return (
            <div
                className='MenuOption SwitchOption menu-option'
                onClick={this.handleOnClick}
            >
                <div className='menu-name'>{name}</div>
                {icon && <div className={`icon ${icon}`}/>}
                <Switch
                    isOn={isOn}
                    onChanged={() => {}}
                />
            </div>
        )
    }
}
