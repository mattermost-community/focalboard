// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import Editor from '@draft-js-plugins/editor'
import createEmojiPlugin from '@draft-js-plugins/emoji'
import '@draft-js-plugins/emoji/lib/plugin.css'
import createMentionPlugin, {
    defaultSuggestionsFilter,
    MentionData,
} from '@draft-js-plugins/mention'
import '@draft-js-plugins/mention/lib/plugin.css'
import {ContentState, DraftHandleValue, EditorState, getDefaultKeyBinding} from 'draft-js'
import React, {
    ReactElement, useCallback,
    useMemo, useRef,
    useState,
} from 'react'

import {useAppSelector} from '../../store/hooks'
import {IUser} from '../../user'
import {getBoardUsersList} from '../../store/users'
import createLiveMarkdownPlugin from '../live-markdown-plugin/liveMarkdownPlugin'

import './markdownEditorInput.scss'

import Entry from './entryComponent/entryComponent'

const imageURLForUser = (window as any).Components?.imageURLForUser

type Props = {
    onChange?: (text: string) => void
    onFocus?: () => void
    onBlur?: (text: string) => void
    initialText?: string
    id?: string
    isEditing: boolean
}

const MarkdownEditorInput = (props: Props): ReactElement => {
    const {onChange, onFocus, onBlur, initialText, id} = props
    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)
    const mentions: MentionData[] = useMemo(() => boardUsers.map((user) => ({name: user.username, avatar: `${imageURLForUser ? imageURLForUser(user.id) : ''}`, is_bot: user.is_bot})), [boardUsers])
    const ref = useRef<Editor>(null)

    const generateEditorState = (text?: string) => {
        const state = EditorState.createWithContent(ContentState.createFromText(text || ''))
        return EditorState.moveSelectionToEnd(state)
    }

    const [editorState, setEditorState] = useState(() => generateEditorState(initialText))

    const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false)
    const [isEmojiPopoverOpen, setIsEmojiPopoverOpen] = useState(false)
    const [suggestions, setSuggestions] = useState(mentions)

    const {MentionSuggestions, plugins, EmojiSuggestions} = useMemo(() => {
        const mentionPlugin = createMentionPlugin({mentionPrefix: '@'})
        const emojiPlugin = createEmojiPlugin()
        const markdownPlugin = createLiveMarkdownPlugin()

        // eslint-disable-next-line @typescript-eslint/no-shadow
        const {EmojiSuggestions} = emojiPlugin
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const {MentionSuggestions} = mentionPlugin
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const plugins = [
            mentionPlugin,
            emojiPlugin,
            markdownPlugin,
        ]
        return {plugins, MentionSuggestions, EmojiSuggestions}
    }, [])

    const onEditorStateChange = useCallback((newEditorState: EditorState) => {
        // newEditorState.
        const newText = newEditorState.getCurrentContent().getPlainText()

        onChange && onChange(newText)
        setEditorState(newEditorState)
    }, [onChange])

    const customKeyBindingFn = useCallback((e: React.KeyboardEvent) => {
        if (isMentionPopoverOpen || isEmojiPopoverOpen) {
            return undefined
        }

        if (e.key === 'Escape') {
            return 'editor-blur'
        }

        if(getDefaultKeyBinding(e) === 'undo'){
            return 'editor-undo'
        }

        if(getDefaultKeyBinding(e) === 'redo'){
            return 'editor-redo'
        }

        return getDefaultKeyBinding(e as any)
    }, [isEmojiPopoverOpen, isMentionPopoverOpen])

    const handleKeyCommand = useCallback((command: string, currentState: EditorState): DraftHandleValue => {        
        if (command === 'editor-blur') {
            ref.current?.blur()
            return 'handled'
        }
        
        if(command === 'editor-redo'){
            const selectionRemovedState = EditorState.redo(currentState)
            onEditorStateChange(EditorState.redo(selectionRemovedState))

            return 'handled'
        }
        
        if(command === 'editor-undo'){
            const selectionRemovedState = EditorState.undo(currentState)
            onEditorStateChange(EditorState.undo(selectionRemovedState))
            
            return 'handled'
        }

        return 'not-handled'
    }, [])

    const onEditorStateBlur = useCallback(() => {
        const text = editorState.getCurrentContent().getPlainText()
        onBlur && onBlur(text)
    }, [editorState, onBlur])

    const onMentionPopoverOpenChange = useCallback((open: boolean) => {
        setIsMentionPopoverOpen(open)
    }, [])

    const onEmojiPopoverOpen = useCallback(() => {
        setIsEmojiPopoverOpen(true)
    }, [])

    const onEmojiPopoverClose = useCallback(() => {
        setIsEmojiPopoverOpen(false)
    }, [])

    const onSearchChange = useCallback(({value}: { value: string }) => {
        setSuggestions(defaultSuggestionsFilter(value, mentions))
    }, [mentions])

    const className = 'MarkdownEditorInput'

    return (
        <div
            className={className}
        >
            <Editor
                editorKey={id}
                editorState={editorState}
                onChange={onEditorStateChange}
                plugins={plugins}
                ref={ref}
                onBlur={onEditorStateBlur}
                onFocus={onFocus}
                keyBindingFn={customKeyBindingFn}
                handleKeyCommand={handleKeyCommand}
            />
            <MentionSuggestions
                open={isMentionPopoverOpen}
                onOpenChange={onMentionPopoverOpenChange}
                suggestions={suggestions}
                onSearchChange={onSearchChange}
                entryComponent={Entry}
            />
            <EmojiSuggestions
                onOpen={onEmojiPopoverOpen}
                onClose={onEmojiPopoverClose}
            />
        </div>
    )
}

export default MarkdownEditorInput
