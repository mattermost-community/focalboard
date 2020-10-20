// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';

import {Utils} from '../utils';

type Props = {
    onChanged: (text: string) => void
    text?: string
    placeholderText?: string
    className?: string
    style?: React.CSSProperties
    isMarkdown: boolean
    isMultiline: boolean

    onFocus?: () => void
    onBlur?: () => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
}

type State = {
}

class Editable extends React.Component<Props, State> {
    static defaultProps = {
        text: '',
	    isMarkdown: false,
        isMultiline: false,
    }

    private _text = ''
    get text(): string {
        return this._text
    }
    set text(value: string) {
        const {isMarkdown} = this.props

        if (!value) {
	        this.elementRef.current.innerText = '';
	    } else {
	        this.elementRef.current.innerHTML = isMarkdown ? Utils.htmlFromMarkdown(value) : Utils.htmlEncode(value)
	    }

	    this._text = value || '';
    }

    private elementRef = React.createRef<HTMLDivElement>()

    constructor(props: Props) {
        super(props)
	    this._text = props.text || '';
    }

    componentDidUpdate(prevPros: Props, prevState: State) {
        this._text = this.props.text || '';
    }

    focus() {
	    this.elementRef.current.focus()

        // Put cursor at end
	    document.execCommand('selectAll', false, null)
        document.getSelection().collapseToEnd()
    }

    blur() {
        this.elementRef.current.blur()
    }

    render() {
	    const {text, className, style, placeholderText, isMarkdown, isMultiline, onFocus, onBlur, onKeyDown, onChanged} = this.props

	    const initialStyle = {...this.props.style}

        let html: string
        if (text) {
            html = isMarkdown ? Utils.htmlFromMarkdown(text) : Utils.htmlEncode(text)
	    } else {
	        html = '';
        }

        const element =
            (<div
                ref={this.elementRef}
                className={'octo-editable ' + className}
                contentEditable={true}
                suppressContentEditableWarning={true}
                style={initialStyle}
                placeholder={placeholderText}

                dangerouslySetInnerHTML={{__html: html}}

                onFocus={() => {
			        this.elementRef.current.innerText = this.text
			        this.elementRef.current.style.color = style?.color || null
			        this.elementRef.current.classList.add('active')

			        if (onFocus) {
                        onFocus()
                    }
			    }}

                onBlur={async () => {
			        const newText = this.elementRef.current.innerText
			        const oldText = this.props.text || '';
			        if (newText !== oldText && onChanged) {
			            onChanged(newText)
			        }

			        this.text = newText

			        this.elementRef.current.classList.remove('active')
			        if (onBlur) {
                        onBlur()
                    }
			    }}

                onKeyDown={(e) => {
			        if (e.keyCode === 27 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // ESC
			            e.stopPropagation()
			            this.elementRef.current.blur()
			        } else if (!isMultiline && e.keyCode === 13 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {	// Return
			            e.stopPropagation()
			            this.elementRef.current.blur()
			        }

			        if (onKeyDown) {
                        onKeyDown(e)
                    }
			    }}
            />);

        return element
    }
}

export {Editable}
