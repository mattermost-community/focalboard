// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './switch.scss'

type Props = {
    onChanged: (isOn: boolean) => void
    isOn: boolean
}

type State = {
    isOn: boolean
}

// Switch is an on-off style switch / checkbox
export default class Switch extends React.Component<Props, State> {
    static defaultProps = {
        isMarkdown: false,
        isMultiline: false,
    }

    constructor(props: Props) {
        super(props)
        this.state = {isOn: props.isOn}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): JSX.Element {
        const {isOn} = this.state

        const className = isOn ? 'Switch on' : 'Switch'
        return (
            <div
                className={className}
                onClick={() => {
                    this.onClicked()
                }}
            >
                <div className='octo-switch-inner'/>
            </div>
        )
    }

    private async onClicked() {
        const newIsOn = !this.state.isOn
        this.setState({isOn: newIsOn})

        const {onChanged} = this.props

        onChanged(newIsOn)
    }
}

export {Switch}
