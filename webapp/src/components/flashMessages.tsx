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
    messages: FlashMessage[]
    fadeOut: boolean
}

export class FlashMessages extends React.PureComponent<Props, State> {
    private timeout: ReturnType<typeof setTimeout> = null

    constructor(props: Props) {
        super(props)
        this.state = {
            messages: [],
            fadeOut: false,
        }
        this.timeout = setTimeout(this.handleFadeOut, this.props.milliseconds - 200)
        emitter.on('message', (message: FlashMessage) => {
            const newMessages = [...this.state.messages]
            newMessages.push(message)
            if (this.state.messages.length === 0) {
                this.timeout = setTimeout(this.handleFadeOut, this.props.milliseconds - 200)
            }
            this.setState({messages: newMessages})
        })
    }

    handleFadeOut = (): void => {
        this.setState({fadeOut: true})
        this.timeout = setTimeout(this.handleTimeout, 200)
    }

    handleTimeout = (): void => {
        const newMessages = [...this.state.messages]
        newMessages.shift()
        if (newMessages.length > 0) {
            this.timeout = setTimeout(this.handleFadeOut, this.props.milliseconds - 200)
        } else {
            this.timeout = null
        }
        this.setState({messages: newMessages, fadeOut: false})
    }

    handleClick = (): void => {
        clearTimeout(this.timeout)
        this.handleTimeout()
    }

    public render(): JSX.Element {
        if (this.state.messages.length === 0) {
            return null
        }

        const message = this.state.messages[0]

        return (
            <div
                className={'FlashMessages ' + message.severity + (this.state.fadeOut ? ' flashOut' : ' flashIn')}
                onClick={this.handleClick}
            >
                {message.content}
            </div>
        )
    }
}
