// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './editable.scss'

type Props = {
    onChange: (value: string) => void
    value?: string
    placeholderText?: string
    className?: string
    saveOnEsc?: boolean
    readonly?: boolean

    onCancel?: () => void
    onSave?: (saveType: 'onEnter'|'onEsc'|'onBlur') => void
}

export default class Editable extends React.Component<Props> {
    private elementRef = React.createRef<HTMLInputElement>()
    private saveOnBlur = true

    shouldComponentUpdate(): boolean {
        return true
    }

    public focus(): void {
        if (this.elementRef.current) {
            const valueLength = this.elementRef.current.value.length
            this.elementRef.current.focus()
            this.elementRef.current.setSelectionRange(valueLength, valueLength)
        }
    }

    public blur = (): void => {
        this.saveOnBlur = false
        this.elementRef.current?.blur()
        this.saveOnBlur = true
    }

    public render(): JSX.Element {
        const {value, onChange, className, placeholderText} = this.props

        return (
            <input
                ref={this.elementRef}
                className={'Editable ' + className}
                placeholder={placeholderText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onChange(e.target.value)
                }}
                value={value}
                title={value}
                onBlur={() => this.saveOnBlur && this.props.onSave && this.props.onSave('onBlur')}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
                    if (e.keyCode === 27 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // ESC
                        e.stopPropagation()
                        if (this.props.saveOnEsc) {
                            this.props.onSave?.('onEsc')
                        } else {
                            this.props.onCancel?.()
                        }
                        this.blur()
                    } else if (e.keyCode === 13 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // Return
                        e.stopPropagation()
                        this.props.onSave?.('onEnter')
                        this.blur()
                    }
                }}
                readOnly={this.props.readonly}
            />
        )
    }
}
