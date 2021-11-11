// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {
    ReactElement,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {EditorState, ContentState} from 'draft-js'
import Editor from '@draft-js-plugins/editor'
import createMentionPlugin, {
    defaultSuggestionsFilter,
    MentionData,
} from '@draft-js-plugins/mention'

import createEmojiPlugin from '@draft-js-plugins/emoji'
import '@draft-js-plugins/emoji/lib/plugin.css'

import {getWorkspaceUsersList} from '../../store/users'
import {useAppSelector} from '../../store/hooks'
import '@draft-js-plugins/mention/lib/plugin.css'
import {IUser} from '../../user'

type Props = {
    onChange?: (text: string) => void
    onFocus?: () => void
    onBlur?: (text: string) => void
    initialText?: string
}

export default function SimpleMentionEditor(props: Props): ReactElement {
    const {onChange, onFocus, onBlur, initialText} = props
    const workspaceUsers = useAppSelector<IUser[]>(getWorkspaceUsersList)
    const mentions: MentionData[] = workspaceUsers.map((user) => ({name: user.username}))
    const ref = useRef<Editor>(null)
    const [editorState, setEditorState] = useState(() => {
        const state = EditorState.moveFocusToEnd(EditorState.createWithContent(ContentState.createFromText(initialText || '')))
        return EditorState.moveSelectionToEnd(state)
    })
    const [open, setOpen] = useState(false)
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
        ]
        return {plugins, MentionSuggestions, EmojiSuggestions}
    }, [])

    useEffect(() => {
        if (ref) {
            setTimeout(() => ref.current?.focus(), 200)
        }
    })

    const onEditorStateBlur = () => {
        const text = editorState.getCurrentContent().getPlainText()
        onBlur && onBlur(text)
    }
    const onEditorStateChange = (newEditorState: EditorState) => {
        const newText = newEditorState.getCurrentContent().getPlainText()
        onChange && onChange(newText)
        setEditorState(newEditorState)
    }
    const onOpenChange = (_open: boolean) => {
        setOpen(_open)
    }
    const onSearchChange = ({value}: { value: string }) => {
        setSuggestions(defaultSuggestionsFilter(value, mentions))
    }

    return (
        <>
            <Editor
                editorKey={'editor'}
                editorState={editorState}
                onChange={onEditorStateChange}
                plugins={plugins}
                ref={ref}
                onBlur={onEditorStateBlur}
                onFocus={onFocus}
            />
            <MentionSuggestions
                open={open}
                onOpenChange={onOpenChange}
                suggestions={suggestions}
                onSearchChange={onSearchChange}
            />
            <EmojiSuggestions/>
        </>
    )
}
