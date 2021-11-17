// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {
    ReactElement,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {getDefaultKeyBinding, EditorState, ContentState, DraftHandleValue} from 'draft-js'
import Editor from '@draft-js-plugins/editor'
import createMentionPlugin, {
    defaultSuggestionsFilter,
    MentionData,
} from '@draft-js-plugins/mention'
import '@draft-js-plugins/mention/lib/plugin.css'
import './simpleMentionEditor.scss'

import createEmojiPlugin from '@draft-js-plugins/emoji'
import '@draft-js-plugins/emoji/lib/plugin.css'

import {getWorkspaceUsersList} from '../../store/users'
import {useAppSelector} from '../../store/hooks'
import {IUser} from '../../user'

const imageURLForUser = (window as any).Components.imageURLForUser

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import createLiveMarkdownPlugin from './draft-js-live-markdown-render'

type Props = {
    onChange?: (text: string) => void
    onFocus?: () => void
    onBlur?: (text: string) => void
    initialText?: string
}

const SimpleMentionEditor = (props: Props): ReactElement => {
    const {onChange, onFocus, onBlur, initialText} = props
    const workspaceUsers = useAppSelector<IUser[]>(getWorkspaceUsersList)
    const mentions: MentionData[] = useMemo(() => workspaceUsers.map((user) => ({name: user.username, avatar: `${imageURLForUser(user.id)}`})), [workspaceUsers])
    const ref = useRef<Editor>(null)
    const [editorState, setEditorState] = useState(() => {
        const state = EditorState.moveFocusToEnd(EditorState.createWithContent(ContentState.createFromText(initialText || '')))
        return EditorState.moveSelectionToEnd(state)
    })
    const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false)
    const [isEmojiPopoverOpen, setIsEmojiPopoverOpen] = useState(false)
    const [suggestions, setSuggestions] = useState(mentions)

    const {MentionSuggestions, plugins, EmojiSuggestions} = useMemo(() => {
        const mentionPlugin = createMentionPlugin({mentionPrefix: '@'})
        const emojiPlugin = createEmojiPlugin()

        // eslint-disable-next-line no-shadow
        const {EmojiSuggestions} = emojiPlugin
        // eslint-disable-next-line no-shadow
        const {MentionSuggestions} = mentionPlugin
        // eslint-disable-next-line no-shadow
        const plugins = [
            mentionPlugin,
            emojiPlugin,
            createLiveMarkdownPlugin() as any,
        ]
        return {plugins, MentionSuggestions, EmojiSuggestions}
    }, [])

    useEffect(() => {
        if (ref) {
            setTimeout(() => ref.current?.focus(), 200)
        }
    })

    const customKeyBindingFn = (e: React.KeyboardEvent) => {
        if (isMentionPopoverOpen || isEmojiPopoverOpen) {
            return undefined
        }

        if (e.key === 'Escape') {
            return 'editor-blur'
        }

        return getDefaultKeyBinding(e as any)
    }

    const handleKeyCommand = (command: string): DraftHandleValue => {
        if (command === 'editor-blur') {
            ref.current?.blur()
            return 'handled'
        }

        return 'not-handled'
    }

    const onEditorStateBlur = () => {
        const text = editorState.getCurrentContent().getPlainText()
        onBlur && onBlur(text)
    }

    const onEditorStateChange = (newEditorState: EditorState) => {
        const newText = newEditorState.getCurrentContent().getPlainText()
        onChange && onChange(newText)
        setEditorState(newEditorState)
    }

    const onMentionPopoverOpenChange = (open: boolean) => {
        setIsMentionPopoverOpen(open)
    }

    const onEmojiPopoverOpen = () => {
        setIsEmojiPopoverOpen(true)
    }

    const onEmojiPopoverClose = () => {
        setIsEmojiPopoverOpen(false)
    }

    const onSearchChange = ({value}: { value: string }) => {
        setSuggestions(defaultSuggestionsFilter(value, mentions))
    }

    return (
        <div className='SimpleMentionEditor'>
            <Editor
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
            />
            <EmojiSuggestions
                onOpen={onEmojiPopoverOpen}
                onClose={onEmojiPopoverClose}
            />
        </div>
    )
}

export default SimpleMentionEditor
