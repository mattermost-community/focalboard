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

    validator?: (value: string) => boolean
    onCancel?: () => void
    onSave?: (saveType: 'onEnter'|'onEsc'|'onBlur') => void
}

export default class Editable extends React.Component<Props> {
    private elementRef = React.createRef<HTMLInputElement>()
    private saveOnBlur = true

    shouldComponentUpdate(): boolean {
        return true
    }

    save = (saveType: 'onEnter'|'onEsc'|'onBlur'): void => {
        if (this.props.validator && !this.props.validator(this.props.value || '')) {
            return
        }
        if (!this.props.onSave) {
            return
        }
        if (saveType === 'onBlur' && !this.saveOnBlur) {
            return
        }
        if (saveType === 'onEsc' && !this.props.saveOnEsc) {
            return
        }
        this.props.onSave(saveType)
    }

    public focus(selectAll = false): void {
        if (this.elementRef.current) {
            const valueLength = this.elementRef.current.value.length
            this.elementRef.current.focus()
            if (selectAll) {
                this.elementRef.current.setSelectionRange(0, valueLength)
            } else {
                this.elementRef.current.setSelectionRange(valueLength, valueLength)
            }
        }
    }

    public blur = (): void => {
        this.saveOnBlur = false
        this.elementRef.current?.blur()
        this.saveOnBlur = true
    }

    public render(): JSX.Element {
        const {value, onChange, className, placeholderText} = this.props
        let error = false
        if (this.props.validator) {
            error = !this.props.validator(value || '')
        }

        return (
            <input
                ref={this.elementRef}
                className={'Editable ' + (error ? 'error ' : '') + className}
                placeholder={placeholderText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onChange(e.target.value)
                }}
                value={value}
                title={value}
                onBlur={() => this.save('onBlur')}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
                    if (e.keyCode === 27 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // ESC
                        e.stopPropagation()
                        if (this.props.saveOnEsc) {
                            this.save('onEsc')
                        } else {
                            this.props.onCancel?.()
                        }
                        this.blur()
                    } else if (e.keyCode === 13 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // Return
                        e.stopPropagation()
                        this.save('onEnter')
                        this.blur()
                    }
                }}
                readOnly={this.props.readonly}
            />
        )
    }
}
