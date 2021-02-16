// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import EasyMDE from 'easymde'
import React from 'react'
import SimpleMDE from 'react-simplemde-editor'

import {Utils} from '../utils'
import './markdownEditor.scss'

type Props = {
    text?: string
    placeholderText?: string
    uniqueId?: string
    className?: string
    readonly?: boolean

    onChange?: (text: string) => void
    onFocus?: () => void
    onBlur?: (text: string) => void
    onAccept?: (text: string) => void
}

type State = {
    isEditing: boolean
}

class MarkdownEditor extends React.Component<Props, State> {
    static defaultProps = {
        text: '',
    }

    get text(): string {
        return this.elementRef.current!.state.value || ''
    }
    set text(value: string) {
        this.elementRef.current!.setState({value})
    }

    private editorInstance?: EasyMDE
    private frameRef = React.createRef<HTMLDivElement>()
    private elementRef = React.createRef<SimpleMDE>()
    private previewRef = React.createRef<HTMLDivElement>()

    constructor(props: Props) {
        super(props)
        this.state = {isEditing: false}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidUpdate(): void {
        const newText = this.props.text || ''
        if (!this.state.isEditing && this.text !== newText) {
            this.text = newText
        }
    }

    showEditor(): void {
        const cm = this.editorInstance?.codemirror
        if (cm) {
            setTimeout(() => {
                cm.refresh()
                cm.focus()
                cm.getInputField()?.focus()
                cm.setCursor(cm.lineCount(), 0) // Put cursor at end
            }, 100)
        }

        this.setState({isEditing: true})
    }

    hideEditor(): void {
        this.editorInstance?.codemirror?.getInputField()?.blur()
        this.setState({isEditing: false})
    }

    render(): JSX.Element {
        const {text, placeholderText, uniqueId, onFocus, onBlur, onChange} = this.props

        let html: string
        if (text) {
            html = Utils.htmlFromMarkdown(text)
        } else {
            html = Utils.htmlFromMarkdown(placeholderText || '')
        }

        const previewElement = (
            <div
                ref={this.previewRef}
                className={text ? 'octo-editor-preview' : 'octo-editor-preview octo-placeholder'}
                style={{display: this.state.isEditing ? 'none' : undefined}}
                dangerouslySetInnerHTML={{__html: html}}
                onClick={() => {
                    if (!this.props.readonly && !this.state.isEditing) {
                        this.showEditor()
                    }
                }}
            />)

        const editorElement = (
            <div
                className='octo-editor-activeEditor'

                // Use visibility instead of display here so the editor is pre-rendered, avoiding a flash on showEditor
                style={this.state.isEditing ? {} : {visibility: 'hidden', position: 'absolute', top: 0, left: 0}}
                onKeyDown={(e) => {
                    // HACKHACK: Need to handle here instad of in CodeMirror because that breaks auto-lists
                    if (e.keyCode === 27 && !e.shiftKey && !(e.ctrlKey || e.metaKey) && !e.altKey) { // Esc
                        this.editorInstance?.codemirror?.getInputField()?.blur()
                    } else if (e.keyCode === 13 && !e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) { // Cmd+Enter
                        this.editorInstance?.codemirror?.getInputField()?.blur()

                        // HACKHACK: Call onAccept after visual state change
                        setTimeout(() => {
                            Utils.log('onAccept')
                            this.props.onAccept?.(this.elementRef.current!.state.value)
                        }, 20)
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
                        //     "Ctrl-Enter": (cm) => {
                        //         cm.getInputField().blur()
                        //     }
                        // })
                    }}
                    value={text}

                    events={{
                        change: () => {
                            if (this.state.isEditing) {
                                const newText = this.elementRef.current!.state.value
                                onChange?.(newText)
                            }
                        },
                        blur: () => {
                            const newText = this.elementRef.current!.state.value
                            const oldText = this.props.text || ''
                            if (newText !== oldText && onChange) {
                                const newHtml = newText ? Utils.htmlFromMarkdown(newText) : Utils.htmlFromMarkdown(placeholderText || '')
                                this.previewRef.current!.innerHTML = newHtml
                                onChange(newText)
                            }

                            this.text = newText

                            this.frameRef.current!.classList.remove('active')

                            if (onBlur) {
                                onBlur(newText)
                            }

                            this.hideEditor()
                        },
                        focus: () => {
                            this.frameRef.current?.classList.add('active')
                            this.elementRef.current?.setState({value: this.text})

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

        const element = (
            <div
                ref={this.frameRef}
                className={`MarkdownEditor octo-editor ${this.props.className || ''}`}
            >
                {previewElement}
                {editorElement}
            </div>)

        return element
    }
}

export {MarkdownEditor}
