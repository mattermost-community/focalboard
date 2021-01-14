// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './switch.scss'

type Props = {
    onChanged: (isOn: boolean) => void
    isOn: boolean
}

// Switch is an on-off style switch / checkbox
export default class Switch extends React.Component<Props> {
    static defaultProps = {
        isMarkdown: false,
        isMultiline: false,
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): JSX.Element {
        const {isOn} = this.props

        const className = isOn ? 'Switch on' : 'Switch'
        return (
            <div
                className={className}
                onClick={this.onClicked}
            >
                <div className='octo-switch-inner'/>
            </div>
        )
    }

    private onClicked = async () => {
        const newIsOn = !this.props.isOn
        this.props.onChanged(newIsOn)
    }
}

export {Switch}
