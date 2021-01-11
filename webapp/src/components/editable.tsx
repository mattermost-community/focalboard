// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Utils} from '../utils'

type Props = {
    onChanged: (text: string) => void
    text?: string
    placeholderText?: string
    className?: string
    style?: React.CSSProperties
    isMarkdown: boolean
    isMultiline: boolean
    allowEmpty: boolean
    readonly?: boolean

    onFocus?: () => void
    onBlur?: () => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

class Editable extends React.PureComponent<Props> {
    static defaultProps = {
        text: '',
        isMarkdown: false,
        isMultiline: false,
        allowEmpty: true,
    }

    private privateText = ''
    get text(): string {
        return this.privateText
    }
    set text(value: string) {
        if (!this.elementRef.current) {
            Utils.assertFailure('elementRef.current')
            return
        }

        const {isMarkdown} = this.props

        if (value) {
            this.elementRef.current.innerHTML = isMarkdown ? Utils.htmlFromMarkdown(value) : Utils.htmlEncode(value)
        } else {
            this.elementRef.current.innerText = ''
        }

        this.privateText = value || ''
    }

    private elementRef = React.createRef<HTMLDivElement>()

    constructor(props: Props) {
        super(props)
        this.privateText = props.text || ''
    }

    componentDidUpdate(): void {
        this.privateText = this.props.text || ''
    }

    focus(): void {
        this.elementRef.current?.focus()

        // Put cursor at end
        document.execCommand('selectAll', false, undefined)
        document.getSelection()?.collapseToEnd()
    }

    blur(): void {
        this.elementRef.current?.blur()
    }

    render(): JSX.Element {
        const {text, style, placeholderText, isMarkdown, isMultiline, onFocus, onBlur, onKeyDown, onChanged} = this.props

        const initialStyle = {...this.props.style}

        let html: string
        if (text) {
            html = isMarkdown ? Utils.htmlFromMarkdown(text) : Utils.htmlEncode(text)
        } else {
            html = ''
        }

        let className = 'octo-editable'
        if (this.props.className) {
            className += ' ' + this.props.className
        }

        const element = (
            <div
                ref={this.elementRef}
                className={className}
                contentEditable={!this.props.readonly}
                suppressContentEditableWarning={true}
                style={initialStyle}
                placeholder={placeholderText}

                dangerouslySetInnerHTML={{__html: html}}

                onFocus={() => {
                    if (this.props.readonly) {
                        return
                    }

                    if (this.elementRef.current) {
                        this.elementRef.current.innerText = this.text
                        this.elementRef.current.style.color = style?.color || ''
                        this.elementRef.current.classList.add('active')
                    }

                    if (onFocus) {
                        onFocus()
                    }
                }}

                onBlur={async () => {
                    if (this.props.readonly) {
                        return
                    }

                    if (this.elementRef.current) {
                        const newText = this.elementRef.current.innerText
                        const oldText = this.props.text || ''
                        if (this.props.allowEmpty || newText) {
                            if (newText !== oldText && onChanged) {
                                onChanged(newText)
                            }

                            this.text = newText
                        } else {
                            this.text = oldText // Reset text
                        }

                        this.elementRef.current.classList.remove('active')
                    }

                    if (onBlur) {
                        onBlur()
                    }
                }}

                onKeyDown={(e) => {
                    if (this.props.readonly) {
                        return
                    }

                    if (e.keyCode === 27 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // ESC
                        e.stopPropagation()
                        this.elementRef.current?.blur()
                    } else if (!isMultiline && e.keyCode === 13 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // Return
                        e.stopPropagation()
                        this.elementRef.current?.blur()
                    }

                    if (onKeyDown) {
                        onKeyDown(e)
                    }
                }}
            />)

        return element
    }
}

export {Editable}
