// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {createNanoEvents} from 'nanoevents'

import './flashMessages.scss'

export type FlashMessage = {
    content: React.ReactNode
    severity: 'low' | 'normal' | 'high'
}

const emitter = createNanoEvents()

export function sendFlashMessage(message: FlashMessage): void {
    emitter.emit('message', message)
}

type Props = {
    milliseconds: number
}

type State = {
    message?: FlashMessage
    fadeOut: boolean
}

export class FlashMessages extends React.PureComponent<Props, State> {
    private timeout?: ReturnType<typeof setTimeout>

    constructor(props: Props) {
        super(props)
        this.state = {fadeOut: false}

        emitter.on('message', (message: FlashMessage) => {
            if (this.timeout) {
                clearTimeout(this.timeout)
                this.timeout = undefined
            }
            this.timeout = setTimeout(this.handleFadeOut, this.props.milliseconds - 200)
            this.setState({message})
        })
    }

    handleFadeOut = (): void => {
        this.setState({fadeOut: true})
        this.timeout = setTimeout(this.handleTimeout, 200)
    }

    handleTimeout = (): void => {
        this.setState({message: undefined, fadeOut: false})
    }

    handleClick = (): void => {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = undefined
        }
        this.handleFadeOut()
    }

    public render(): JSX.Element | null {
        if (!this.state.message) {
            return null
        }

        const {message, fadeOut} = this.state

        return (
            <div
                className={'FlashMessages ' + message.severity + (fadeOut ? ' flashOut' : ' flashIn')}
                onClick={this.handleClick}
            >
                {message.content}
            </div>
        )
    }
}
