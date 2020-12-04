// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './labelOption.scss'

type LabelOptionProps = {
    icon?: string
    children: React.ReactNode
}

export default class LabelOption extends React.PureComponent<LabelOptionProps> {
    public render(): JSX.Element {
        return (
            <div className='MenuOption LabelOption menu-option'>
                {this.props.icon ?? <div className='noicon'/>}
                <div className='menu-name'>{this.props.children}</div>
                <div className='noicon'/>
            </div>
        )
    }
}
