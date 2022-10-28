// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, Suspense} from 'react'

import {Utils} from '../utils'
import './markdownEditor.scss'

const MarkdownEditorInput = React.lazy(() => import('./markdownEditorInput/markdownEditorInput'))

type Props = {
    id?: string
    text?: string
    placeholderText?: string
    className?: string
    readonly?: boolean
    focus?: boolean

    onChange?: (text: string) => void
    onFocus?: () => void
    onBlur?: (text: string) => void
}

const MarkdownEditor = (props: Props): JSX.Element => {
    const {placeholderText, onFocus, onBlur, onChange, text, id, focus = false} = props
    const [isEditing, setIsEditing] = useState(focus)
    const html: string = Utils.htmlFromMarkdown(text || placeholderText || '')

    const previewElement = (
        <div
            data-testid='preview-element'
            className={text ? 'octo-editor-preview' : 'octo-editor-preview octo-placeholder'}
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

    const editorOnBlur = (newText: string) => {
        setIsEditing(false)
        onBlur && onBlur(newText)
    }

    const editorElement = (
        <Suspense fallback={<></>}>
            <MarkdownEditorInput
                id={id}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={editorOnBlur}
                initialText={text}
                isEditing={isEditing}
            />
        </Suspense>
    )

    const element = (
        <div className={`MarkdownEditor octo-editor ${props.className || ''} ${isEditing ? 'active' : ''}`}>
            {isEditing ? editorElement : previewElement}
        </div>
    )

    return element
}

export {MarkdownEditor}
