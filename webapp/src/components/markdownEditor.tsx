// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import EasyMDE from 'easymde';
import React from 'react';
import SimpleMDE from 'react-simplemde-editor';

import {Utils} from '../utils';

type Props = {
    onChanged: (text: string) => void
    text?: string
    placeholderText?: string
    uniqueId?: string

    onFocus?: () => void
    onBlur?: () => void
}

type State = {
    isEditing: boolean
}

class MarkdownEditor extends React.Component<Props, State> {
    static defaultProps = {
        text: '',
    }

    get text(): string {
        return this.elementRef.current.state.value
    }
    set text(value: string) {
        this.elementRef.current.setState({value})
    }

    private editorInstance: EasyMDE
    private frameRef = React.createRef<HTMLDivElement>()
    private elementRef = React.createRef<SimpleMDE>()
    private previewRef = React.createRef<HTMLDivElement>()

    constructor(props: Props) {
	    super(props)
	    this.state = {isEditing: false}
    }

    componentDidUpdate(prevPros: Props, prevState: State) {
	    this.text = this.props.text || '';
    }

    showEditor() {
        const cm = this.editorInstance?.codemirror
	    if (cm) {
            setTimeout(() => {
                cm.refresh()
                cm.focus()
                cm.getInputField()?.focus()
                cm.setCursor(cm.lineCount(), 0)		// Put cursor at end
	        }, 100)
        }

	    this.setState({isEditing: true})
    }

    hideEditor() {
	    this.editorInstance?.codemirror?.getInputField()?.blur()
        this.setState({isEditing: false})
    }

    render() {
        const {text, placeholderText, uniqueId, onFocus, onBlur, onChanged} = this.props
        const {isEditing} = this.state

        let html: string
        if (text) {
	        html = Utils.htmlFromMarkdown(text)
	    } else {
            html = Utils.htmlFromMarkdown(placeholderText || '')
        }

	    const previewElement =
    (<div
        ref={this.previewRef}
        className={text ? 'octo-editor-preview' : 'octo-editor-preview octo-placeholder'}
        style={{display: isEditing ? 'none' : null}}
        dangerouslySetInnerHTML={{__html: html}}
        onClick={() => {
			        if (!isEditing) {
			            this.showEditor()
			        }
			    }}
    />);

        const editorElement =
            (<div
                className='octo-editor-activeEditor'

                // Use visibility instead of display here so the editor is pre-rendered, avoiding a flash on showEditor
                style={isEditing ? {} : {visibility: 'hidden', position: 'absolute', top: 0, left: 0}}
                onKeyDown={(e) => {
			        // HACKHACK: Need to handle here instad of in CodeMirror because that breaks auto-lists
			        if (e.keyCode === 27 && !e.shiftKey && !(e.ctrlKey || e.metaKey) && !e.altKey) {		// Esc
			            this.editorInstance?.codemirror?.getInputField()?.blur()
			        }
			    }}
            >
                <SimpleMDE
                    id={uniqueId}
                    ref={this.elementRef}
                    getMdeInstance={(instance) => {
			            this.editorInstance = instance

			            // BUGBUG: This breaks auto-lists
			            // instance.codemirror.setOption("extraKeys", {
			            // 	"Ctrl-Enter": (cm) => {
			            // 		cm.getInputField().blur()
			            // 	}
			            // })
			        }}
                    value={text}

                    // onChange={() => {
			        // 	// We register a change onBlur, consider implementing "auto-save" later
			        // }}
                    events={{
			            blur: () => {
			                const newText = this.elementRef.current.state.value
			                const oldText = this.props.text || '';
			                if (newText !== oldText && onChanged) {
			                    const newHtml = newText ? Utils.htmlFromMarkdown(newText) : Utils.htmlFromMarkdown(placeholderText || '')
			                    this.previewRef.current.innerHTML = newHtml
			                    onChanged(newText)
			                }

			                this.text = newText

			                this.frameRef.current.classList.remove('active')

			                if (onBlur) {
                                onBlur()
                            }

			                this.hideEditor()
			            },
			            focus: () => {
			                this.frameRef.current.classList.add('active')

			                this.elementRef.current.setState({value: this.text})

			                if (onFocus) {
                                onFocus()
                            }
			            },
			        }}
                    options={{
			            autoDownloadFontAwesome: true,
			            toolbar: false,
			            status: false,
			            spellChecker: false,
			            minHeight: '10px',
			            shortcuts: {
			                toggleStrikethrough: 'Cmd-.',
			                togglePreview: null,
			                drawImage: null,
			                drawLink: null,
			                toggleSideBySide: null,
			                toggleFullScreen: null,
			            },
			        }}
                />
            </div>)

        const element =
            (<div
                ref={this.frameRef}
                className='octo-editor'
            >
                {previewElement}
                {editorElement}
            </div>)

        return element
    }
}

export {MarkdownEditor}
