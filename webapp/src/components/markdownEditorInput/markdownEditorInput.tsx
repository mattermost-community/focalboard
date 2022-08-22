// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import Editor from '@draft-js-plugins/editor'
import createEmojiPlugin from '@draft-js-plugins/emoji'
import '@draft-js-plugins/emoji/lib/plugin.css'
import createMentionPlugin from '@draft-js-plugins/mention'
import '@draft-js-plugins/mention/lib/plugin.css'
import {ContentState, DraftHandleValue, EditorState, getDefaultKeyBinding} from 'draft-js'
import React, {
    ReactElement, useCallback, useEffect,
    useMemo, useRef,
    useState,
} from 'react'

import {debounce} from "lodash"

import {useAppSelector} from '../../store/hooks'
import {IUser} from '../../user'
import {getBoardUsersList} from '../../store/users'
import createLiveMarkdownPlugin from '../live-markdown-plugin/liveMarkdownPlugin'
import {useHasPermissions} from '../../hooks/permissions'
import {Permission} from '../../constants'
import {BoardMember} from '../../blocks/board'
import mutator from '../../mutator'
import ConfirmAddUserForNotifications from '../confirmAddUserForNotifications'
import RootPortal from '../rootPortal'

import './markdownEditorInput.scss'

import {BoardTypeOpen} from '../../blocks/board'
import {getCurrentBoard} from '../../store/boards'
import octoClient from '../../octoClient'

import {Utils} from '../../utils'
import {ClientConfig} from '../../config/clientConfig'
import {getClientConfig} from '../../store/clientConfig'

import Entry from './entryComponent/entryComponent'

const imageURLForUser = (window as any).Components?.imageURLForUser

type MentionUser = {
    user: IUser,
    name: string
    avatar: string
    is_bot: boolean
    displayName: string
    isBoardMember: boolean
}

type Props = {
    onChange?: (text: string) => void
    onFocus?: () => void
    onBlur?: (text: string) => void
    initialText?: string
    id?: string
    isEditing: boolean
}

const MarkdownEditorInput = (props: Props): ReactElement => {
    const {onChange, onFocus, onBlur, initialText, id, isEditing} = props
    const boardUsers = useAppSelector<IUser[]>(getBoardUsersList)
    const board = useAppSelector(getCurrentBoard)
    const clientConfig = useAppSelector<ClientConfig>(getClientConfig)
    const ref = useRef<Editor>(null)
    const allowAddUsers = useHasPermissions(board.teamId, board.id, [Permission.ManageBoardRoles])
    const [confirmAddUser, setConfirmAddUser] = useState<IUser|null>(null)

    const [suggestions, setSuggestions] = useState<Array<MentionUser>>([])

    const loadSuggestions = async (term: string) => {
        let users: Array<IUser>

        if (allowAddUsers || (board && board.type === BoardTypeOpen)) {
            users = await octoClient.searchTeamUsers(term)
        } else {
            users = boardUsers
        }

        const mentions = users.map(
            (user) => ({
                name: user.username,
                avatar: `${imageURLForUser ? imageURLForUser(user.id) : ''}`,
                is_bot: user.is_bot,
                displayName: Utils.getUserDisplayName(user, clientConfig.teammateNameDisplay),
                isBoardMember: Boolean(boardUsers.find((u) => u.id === user.id)),
                user: user,
            }))
        setSuggestions(mentions)
    }

    const debouncedLoadSuggestion = useMemo(() => debounce(loadSuggestions, 200), [])

    useEffect(() => {
        // Get the ball rolling. Searching for empty string
        // returns first 10 users in alphabetical order.
        loadSuggestions('')
    }, [])


    const generateEditorState = (text?: string) => {
        const state = EditorState.createWithContent(ContentState.createFromText(text || ''))
        return EditorState.moveSelectionToEnd(state)
    }

    const [editorState, setEditorState] = useState(() => {
        return generateEditorState(initialText)
    })

    const addUser = useCallback(async (userId: string, role: string) => {
        const newMember = {
            boardId: board.id,
            userId: userId,
            roles: role,
            schemeAdmin: role === 'Admin',
            schemeEditor: role === 'Admin' || role === 'Editor',
            schemeCommenter: role === 'Admin' || role === 'Editor' || role === 'Commenter',
            schemeViewer: role === 'Admin' || role === 'Editor' || role === 'Commenter' || role === 'Viewer',
        } as BoardMember

        setConfirmAddUser(null)
        setEditorState(EditorState.moveSelectionToEnd(editorState))
        ref.current?.focus()
        await mutator.createBoardMember(board.id, newMember.userId)
        mutator.updateBoardMember(newMember, {...newMember, schemeAdmin: false, schemeEditor: true, schemeCommenter: true, schemeViewer: true})
    }, [board, editorState])

    const [initialTextCache, setInitialTextCache] = useState<string | undefined>(initialText)

    // avoiding stale closure
    useEffect(() => {
        // only change editor state when initialText actually changes from one defined value to another.
        // This is needed to make the mentions plugin work. For some reason, if we don't check
        // for this if condition here, mentions don't work. I suspect it's because without
        // the in condition, we're changing editor state twice during component initialization
        // and for some reason it causes mentions to not show up.
        if (initialText && initialText !== initialTextCache) {
            setEditorState(generateEditorState(initialText || ''))
            setInitialTextCache(initialText)
        }
    }, [initialText])

    const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false)
    const [isEmojiPopoverOpen, setIsEmojiPopoverOpen] = useState(false)

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

    useEffect(() => {
        if (isEditing) {
            if (initialText === '') {
                setEditorState(EditorState.createEmpty())
            } else {
                setEditorState(EditorState.moveSelectionToEnd(editorState))
            }
            setTimeout(() => ref.current?.focus(), 200)
        }
    }, [isEditing, initialText])

    const customKeyBindingFn = useCallback((e: React.KeyboardEvent) => {
        if (isMentionPopoverOpen || isEmojiPopoverOpen) {
            return undefined
        }

        if (e.key === 'Escape') {
            return 'editor-blur'
        }

        return getDefaultKeyBinding(e as any)
    }, [isEmojiPopoverOpen, isMentionPopoverOpen])

    const handleKeyCommand = useCallback((command: string): DraftHandleValue => {
        if (command === 'editor-blur') {
            ref.current?.blur()
            return 'handled'
        }

        return 'not-handled'
    }, [])

    const onEditorStateBlur = useCallback(() => {
        if (confirmAddUser) {
            return
        }
        const text = editorState.getCurrentContent().getPlainText()
        onBlur && onBlur(text)
    }, [editorState, onBlur])

    const onEditorStateChange = useCallback((newEditorState: EditorState) => {
        const newText = newEditorState.getCurrentContent().getPlainText()

        onChange && onChange(newText)
        setEditorState(newEditorState)
    }, [onChange])

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
        debouncedLoadSuggestion(value)
    }, [suggestions])

    let className = 'MarkdownEditorInput'
    if (!isEditing) {
        className += ' MarkdownEditorInput--IsNotEditing'
    }

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
                onAddMention={(mention) => {
                    if (mention.isBoardMember) {
                        return
                    }
                    setConfirmAddUser(mention.user)
                }}
            />
            <EmojiSuggestions
                onOpen={onEmojiPopoverOpen}
                onClose={onEmojiPopoverClose}
            />
            {confirmAddUser &&
                <RootPortal>
                    <ConfirmAddUserForNotifications
                        user={confirmAddUser}
                        onConfirm={addUser}
                        onClose={() => {
                            setConfirmAddUser(null)
                            setEditorState(EditorState.moveSelectionToEnd(editorState))
                            ref.current?.focus()
                        }}
                    />
                </RootPortal>}
        </div>
    )
}

export default MarkdownEditorInput
