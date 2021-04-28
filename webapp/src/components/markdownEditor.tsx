// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import EasyMDE from 'easymde'
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

const MarkdownEditor = (props: Props): JSX. Element => {
    const {placeholderText, uniqueId, onFocus, onBlur, onChange} = props

    const [isEditing, setIsEditing] = useState(false)
    const [active, setActive] = useState(false)
    const [text, setText] = useState(props.text)
    const [editorInstance, setEditorInstance] = useState<EasyMDE>()

    const showEditor = (): void => {
        const cm = editorInstance?.codemirror
        if (cm) {
            setTimeout(() => {
                cm.refresh()
                cm.focus()
                cm.getInputField()?.focus()
                cm.setCursor(cm.lineCount(), 0) // Put cursor at end
            }, 100)
        }

        setIsEditing(true)
    }

    useEffect(() => {
        if (!isEditing && text !== props.text) {
            setText(props.text)
        }
    }, [props.text])

    const html: string = Utils.htmlFromMarkdown(text || placeholderText || '')

    const previewElement = (
        <div
            className={text ? 'octo-editor-preview' : 'octo-editor-preview octo-placeholder'}
            style={{display: isEditing ? 'none' : undefined}}
            dangerouslySetInnerHTML={{__html: html}}
            onClick={() => {
                if (!props.readonly && !isEditing) {
                    showEditor()
                }
            }}
        />)

    const editorElement = (
        <div
            className='octo-editor-activeEditor'

            // Use visibility instead of display here so the editor is pre-rendered, avoiding a flash on showEditor
            style={isEditing ? {} : {visibility: 'hidden', position: 'absolute', top: 0, left: 0}}
            onKeyDown={(e) => {
                // HACKHACK: Need to handle here instad of in CodeMirror because that breaks auto-lists
                if (e.keyCode === 27 && !e.shiftKey && !(e.ctrlKey || e.metaKey) && !e.altKey) { // Esc
                    editorInstance?.codemirror?.getInputField()?.blur()
                } else if (e.keyCode === 13 && !e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) { // Cmd+Enter
                    editorInstance?.codemirror?.getInputField()?.blur()

                    // HACKHACK: Call onAccept after visual state change
                    setTimeout(() => {
                        Utils.log('onAccept')
                        props.onAccept?.(text || '')
                    }, 20)
                }
            }}
        >
            <SimpleMDE
                id={uniqueId}
                getMdeInstance={(instance) => {
                    setEditorInstance(instance)

                    // BUGBUG: This breaks auto-lists
                    // instance.codemirror.setOption("extraKeys", {
                    //     "Ctrl-Enter": (cm) => {
                    //         cm.getInputField().blur()
                    //     }
                    // })
                }}
                value={text}

                events={{
                    change: (instance: any) => {
                        if (isEditing) {
                            const newText = instance.getValue()
                            onChange?.(newText)
                        }
                    },
                    blur: (instance: any) => {
                        const newText = instance.getValue()
                        const oldText = text || ''
                        if (newText !== oldText && onChange) {
                            onChange(newText)
                        }

                        setActive(false)

                        if (onBlur) {
                            onBlur(newText)
                        }

                        instance.getInputField()?.blur()
                        setIsEditing(false)
                    },
                    focus: () => {
                        setActive(true)

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
        <div className={`MarkdownEditor octo-editor ${props.className || ''} ${active ? 'active' : ''}`}>
            {previewElement}
            {editorElement}
        </div>)

    return element
}

export {MarkdownEditor}
