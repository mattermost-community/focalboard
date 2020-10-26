// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './editable.scss'

type Props = {
    onChange: (value: string) => void
    value?: string
    placeholderText?: string
    className?: string

    onFocus?: () => void
    onBlur?: () => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export default class Editable extends React.Component<Props> {
    private elementRef = React.createRef<HTMLInputElement>()

    shouldComponentUpdate(): boolean {
        return true
    }

    public focus(): void {
        this.elementRef.current.focus()

        // Put cursor at end
        // document.execCommand('selectAll', false, null)
        // document.getSelection().collapseToEnd()
    }

    public blur(): void {
        this.elementRef.current.blur()
    }

    public render(): JSX.Element {
        const {value, onChange, className, placeholderText, onFocus, onBlur, onKeyDown} = this.props

        return (
            <input
                ref={this.elementRef}
                className={'Editable ' + className}
                placeholder={placeholderText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    onChange(e.target.value)
                }}
                value={value}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
            />
        )
    }
}
