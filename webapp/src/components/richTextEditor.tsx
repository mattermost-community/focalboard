// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useRef, useEffect} from 'react'

import {Utils} from '../utils'
import './richTextEditor.scss'

type Props = {
    id?: string
    text?: string
    placeholderText?: string
    className?: string
    readonly?: boolean

    onChange?: (text: string) => void
    onFocus?: () => void
    onBlur?: (text: string) => void
    onKeyDown?: (e: React.KeyboardEvent) => void
    onEditorCancel?: () => void
    autofocus?: boolean
    saveOnEnter?: boolean
}

const RichTextEditor = (props: Props): JSX.Element => {
    const {placeholderText, onFocus, onEditorCancel, onBlur, onChange, text, id, saveOnEnter} = props
    const [isEditing, setIsEditing] = useState(Boolean(props.autofocus))
    const [editorText, setEditorText] = useState(text || '')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    
    const html: string = Utils.htmlFromMarkdown(editorText || placeholderText || '')

    useEffect(() => {
        setEditorText(text || '')
    }, [text])

    const handleSave = () => {
        if (onBlur) {
            onBlur(editorText)
        }
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditorText(text || '')
        if (onEditorCancel) {
            onEditorCancel()
        }
        setIsEditing(false)
    }

    const handleChange = (newText: string) => {
        setEditorText(newText)
        if (onChange) {
            onChange(newText)
        }
    }

    const wrapSelection = (before: string, after: string) => {
        if (!textareaRef.current) return

        const start = textareaRef.current.selectionStart
        const end = textareaRef.current.selectionEnd
        const selectedText = editorText.substring(start, end)
        const newText = editorText.substring(0, start) + before + selectedText + after + editorText.substring(end)
        
        handleChange(newText)
        
        // Restore cursor position
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = start + before.length
                textareaRef.current.selectionEnd = end + before.length
                textareaRef.current.focus()
            }
        }, 0)
    }

    const insertList = (type: 'bullet' | 'number') => {
        if (!textareaRef.current) return

        const start = textareaRef.current.selectionStart
        const lines = editorText.substring(0, start).split('\n')
        const currentLine = lines[lines.length - 1]
        const indent = currentLine.match(/^\s*/)?.[0] || ''
        
        const listPrefix = type === 'bullet' ? `${indent}- ` : `${indent}1. `
        const newText = editorText.substring(0, start) + listPrefix + editorText.substring(start)
        
        handleChange(newText)
        
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = start + listPrefix.length
                textareaRef.current.selectionEnd = start + listPrefix.length
                textareaRef.current.focus()
            }
        }, 0)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
            case 'b':
                e.preventDefault()
                wrapSelection('**', '**')
                break
            case 'i':
                e.preventDefault()
                wrapSelection('*', '*')
                break
            case 'u':
                e.preventDefault()
                wrapSelection('__', '__')
                break
            case 's':
                e.preventDefault()
                wrapSelection('~~', '~~')
                break
            case 'Enter':
                e.preventDefault()
                handleSave()
                break
            }
        }

        if (props.onKeyDown) {
            props.onKeyDown(e)
        }
    }

    const previewElement = (
        <div
            data-testid='preview-element'
            className={editorText ? 'octo-editor-preview' : 'octo-editor-preview octo-placeholder'}
            dangerouslySetInnerHTML={{__html: html}}
            onClick={(e) => {
                const LINK_TAG_NAME = 'a'
                const element = e.target as Element
                if (element.tagName.toLowerCase() === LINK_TAG_NAME) {
                    e.stopPropagation()
                    return
                }

                if (!props.readonly && !isEditing) {
                    setIsEditing(true)
                }
            }}
        />
    )

    if (props.readonly || !isEditing) {
        return previewElement
    }

    return (
        <div className={`RichTextEditor ${props.className || ''}`}>
            <div className='toolbar'>
                <button 
                    type='button'
                    className='btn-format'
                    onClick={() => wrapSelection('**', '**')}
                    title='Bold (Ctrl+B)'
                >
                    <strong>B</strong>
                </button>
                <button 
                    type='button'
                    className='btn-format'
                    onClick={() => wrapSelection('*', '*')}
                    title='Italic (Ctrl+I)'
                >
                    <em>I</em>
                </button>
                <button 
                    type='button'
                    className='btn-format'
                    onClick={() => wrapSelection('__', '__')}
                    title='Underline (Ctrl+U)'
                >
                    <u>U</u>
                </button>
                <button 
                    type='button'
                    className='btn-format'
                    onClick={() => wrapSelection('~~', '~~')}
                    title='Strikethrough (Ctrl+S)'
                >
                    <s>S</s>
                </button>
                <button 
                    type='button'
                    className='btn-format'
                    onClick={() => insertList('bullet')}
                    title='Bullet List'
                >
                    • List
                </button>
                <button 
                    type='button'
                    className='btn-format'
                    onClick={() => insertList('number')}
                    title='Numbered List'
                >
                    1. List
                </button>
            </div>
            <textarea
                ref={textareaRef}
                id={id}
                className='editor-textarea'
                dir='auto'
                value={editorText}
                placeholder={placeholderText}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={onFocus}
                autoFocus={props.autofocus}
                rows={6}
            />
            <div className='editor-actions'>
                <button 
                    className='btn btn-primary'
                    onClick={handleSave}
                >
                    Save
                </button>
                <button 
                    className='btn btn-secondary'
                    onClick={handleCancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default RichTextEditor
