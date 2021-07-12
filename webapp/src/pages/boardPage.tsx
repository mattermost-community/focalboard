// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'
import {generatePath, withRouter, RouteComponentProps} from 'react-router-dom'
import HotKeys from 'react-hot-keys'

import {IBlock} from '../blocks/block'
import {IWorkspace} from '../blocks/workspace'
import {sendFlashMessage} from '../components/flashMessages'
import Workspace from '../components/workspace'
import mutator from '../mutator'
import octoClient from '../octoClient'
import {OctoListener} from '../octoListener'
import {Utils} from '../utils'
import {BoardTree, MutableBoardTree} from '../viewModel/boardTree'
import {MutableWorkspaceTree, WorkspaceTree} from '../viewModel/workspaceTree'
import './boardPage.scss'
import {IUser, WorkspaceUsersContext, WorkspaceUsers} from '../user'

type Props = RouteComponentProps<{workspaceId?: string, boardId?: string, viewId?: string}> & {
    readonly?: boolean
    intl: IntlShape
}

type State = {
    workspace?: IWorkspace,
    workspaceTree: WorkspaceTree
    boardTree?: BoardTree
    syncFailed?: boolean
    websocketClosedTimeOutId?: ReturnType<typeof setTimeout>
    websocketClosed?: boolean
    workspaceUsers: WorkspaceUsers
}

class BoardPage extends React.Component<Props, State> {
    private workspaceListener = new OctoListener()

    constructor(props: Props) {
        super(props)

        // Backward compatible query param urls to regular urls
        const queryString = new URLSearchParams(window.location.search)
        const queryBoardId = queryString.get('id')
        const queryViewId = queryString.get('v')
        if (queryBoardId) {
            const params = {...props.match.params, boardId: queryBoardId}
            if (queryViewId) {
                params.viewId = queryViewId
            }
            const newPath = generatePath(props.match.path, params)
            props.history.push(newPath)
        }

        if (!props.match.params.boardId) {
            // Load last viewed boardView
            const boardId = localStorage.getItem('lastBoardId') || undefined
            const viewId = localStorage.getItem('lastViewId') || undefined
            if (boardId) {
                const newPath = generatePath(props.match.path, {...props.match.params, boardId, viewId})
                props.history.push(newPath)
            }
        }

        this.state = {
            workspaceTree: new MutableWorkspaceTree(),
            workspaceUsers: {
                users: new Array<IUser>(),
                usersById: new Map<string, IUser>(),
            },
        }

        this.setWorkspaceUsers()
        Utils.log(`BoardPage. boardId: ${props.match.params.boardId}`)
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidUpdate(prevProps: Props, prevState: State): void {
        Utils.log('componentDidUpdate')
        const board = this.state.boardTree?.board
        const prevBoard = prevState.boardTree?.board

        const activeView = this.state.boardTree?.activeView
        const prevActiveView = prevState.boardTree?.activeView

        if (board?.icon !== prevBoard?.icon) {
            Utils.setFavicon(board?.icon)
        }
        if (board?.title !== prevBoard?.title || activeView?.title !== prevActiveView?.title) {
            if (board) {
                let title = `${board.title}`
                if (activeView?.title) {
                    title += ` | ${activeView.title}`
                }
                document.title = title
            } else {
                document.title = 'Focalboard'
            }
        }
        if (this.state.workspace?.id !== prevState.workspace?.id) {
            this.setWorkspaceUsers()
        }
    }

    async setWorkspaceUsers() {
        const workspaceUsers = await octoClient.getWorkspaceUsers()

        // storing workspaceUsersById in state to avoid re-computation in each render cycle
        this.setState({
            workspaceUsers,
        })
    }

    getIdToWorkspaceUsers(users: Array<IUser>): Map<string, IUser> {
        return users.reduce((acc: Map<string, IUser>, user: IUser) => {
            acc.set(user.id, user)
            return acc
        }, new Map())
    }

    private undoRedoHandler = async (keyName: string, e: KeyboardEvent) => {
        if (e.target !== document.body || this.props.readonly) {
            return
        }

        if (keyName === 'ctrl+z' || keyName === 'cmd+z') { // Cmd+Z
            Utils.log('Undo')
            if (mutator.canUndo) {
                const description = mutator.undoDescription
                await mutator.undo()
                if (description) {
                    sendFlashMessage({content: `Undo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Undo', severity: 'low'})
                }
            } else {
                sendFlashMessage({content: 'Nothing to Undo', severity: 'low'})
            }
        } else if (keyName === 'shift+ctrl+z' || keyName === 'shift+cmd+z') { // Shift+Cmd+Z
            Utils.log('Redo')
            if (mutator.canRedo) {
                const description = mutator.redoDescription
                await mutator.redo()
                if (description) {
                    sendFlashMessage({content: `Redo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Redu', severity: 'low'})
                }
            } else {
                sendFlashMessage({content: 'Nothing to Redo', severity: 'low'})
            }
        }
    }

    componentDidMount(): void {
        if (this.props.match.params.boardId) {
            this.attachToBoard(this.props.match.params.boardId, this.props.match.params.viewId)
        } else {
            this.sync()
        }
    }

    componentWillUnmount(): void {
        Utils.log(`boardPage.componentWillUnmount: ${this.props.match.params.boardId}`)
        this.workspaceListener.close()
    }

    render(): JSX.Element {
        const {intl} = this.props
        const {workspace, workspaceTree} = this.state

        Utils.log(`BoardPage.render (workspace ${this.props.match.params.workspaceId || '0'}) ${this.state.boardTree?.board?.title}`)

        // TODO: Make this less brittle. This only works because this is the root render function
        octoClient.workspaceId = this.props.match.params.workspaceId || '0'

        if (this.props.readonly && this.state.syncFailed) {
            Utils.log('BoardPage.render: sync failed')
            return (
                <div className='BoardPage'>
                    <div className='error'>
                        {intl.formatMessage({id: 'BoardPage.syncFailed', defaultMessage: 'Board may be deleted or access revoked.'})}
                    </div>
                </div>
            )
        }

        return (
            <WorkspaceUsersContext.Provider value={this.state.workspaceUsers}>
                <div className='BoardPage'>
                    <HotKeys
                        keyName='shift+ctrl+z,shift+cmd+z,ctrl+z,cmd+z'
                        onKeyDown={this.undoRedoHandler}
                    />
                    {(this.state.websocketClosed) &&
                    <div className='banner error'>
                        <a
                            href='https://www.focalboard.com/fwlink/websocket-connect-error.html'
                            target='_blank'
                            rel='noreferrer'
                        >
                            <FormattedMessage
                                id='Error.websocket-closed'
                                defaultMessage='Websocket connection closed, connection interrupted. If this persists, check your server or web proxy configuration.'
                            />
                        </a>
                    </div>
                    }

                    <Workspace
                        workspace={workspace}
                        workspaceTree={workspaceTree}
                        boardTree={this.state.boardTree}
                        setSearchText={(text) => {
                            this.setSearchText(text)
                        }}
                        readonly={this.props.readonly || false}
                    />
                </div>
            </WorkspaceUsersContext.Provider>
        )
    }

    private async attachToBoard(boardId?: string, viewId = '') {
        Utils.log(`attachToBoard: ${boardId}`)
        localStorage.setItem('lastBoardId', boardId || '')
        localStorage.setItem('lastViewId', viewId)

        if (boardId) {
            this.sync()
        } else {
            const newPath = generatePath(this.props.match.path, {...this.props.match.params, boardId: '', viewId: ''})
            this.props.history.push(newPath)
        }
    }

    private async sync() {
        Utils.log(`sync start: ${this.props.match.params.boardId}`)

        let workspace: IWorkspace | undefined
        if (!this.props.readonly) {
            // Require workspace for editing, not for sharing (readonly)
            workspace = await octoClient.getWorkspace()
            if (!workspace) {
                this.props.history.push(Utils.buildURL('/error?id=no_workspace'))
            }
        }

        const workspaceTree = await MutableWorkspaceTree.sync()
        const boardIds = [...workspaceTree.boards.map((o) => o.id), ...workspaceTree.boardTemplates.map((o) => o.id)]
        this.setState({workspace, workspaceTree})

        let boardIdsToListen: string[]
        if (boardIds.length > 0) {
            boardIdsToListen = ['', ...boardIds]
        } else {
            // Read-only view
            boardIdsToListen = [this.props.match.params.boardId || '']
        }

        // Listen to boards plus all blocks at root (Empty string for parentId)
        this.workspaceListener.open(
            octoClient.workspaceId,
            boardIdsToListen,
            async (blocks) => {
                Utils.log(`workspaceListener.onChanged: ${blocks.length}`)
                this.incrementalUpdate(blocks)
            },
            () => {
                Utils.log('workspaceListener.onReconnect')
                this.sync()
            },
            (state) => {
                switch (state) {
                case 'close': {
                    // Show error after a delay to ignore brief interruptions
                    if (!this.state.websocketClosed && !this.state.websocketClosedTimeOutId) {
                        const timeoutId = setTimeout(() => {
                            this.setState({websocketClosed: true, websocketClosedTimeOutId: undefined})
                        }, 5000)
                        this.setState({websocketClosedTimeOutId: timeoutId})
                    }
                    break
                }
                case 'open': {
                    if (this.state.websocketClosedTimeOutId) {
                        clearTimeout(this.state.websocketClosedTimeOutId)
                    }
                    this.setState({websocketClosed: false, websocketClosedTimeOutId: undefined})
                    Utils.log('Connection established')
                    break
                }
                }
            },
        )

        if (this.props.match.params.boardId) {
            const boardTree = await MutableBoardTree.sync(this.props.match.params.boardId || '', this.props.match.params.viewId || '')

            if (boardTree && boardTree.board) {
                // Update url with viewId if it's different
                if (boardTree.activeView.id !== this.props.match.params.viewId) {
                    const newPath = generatePath(this.props.match.path, {...this.props.match.params, viewId: boardTree.activeView.id})
                    this.props.history.push(newPath)
                }

                // TODO: Handle error (viewId not found)

                this.setState({
                    boardTree,
                    syncFailed: false,
                })
                Utils.log(`sync complete: ${boardTree.board?.id} (${boardTree.board?.title})`)
            } else {
                // Board may have been deleted
                this.setState({
                    boardTree: undefined,
                    syncFailed: true,
                })
                Utils.log(`sync complete: board ${this.props.match.params.boardId} not found`)
            }
        }
    }

    private async incrementalUpdate(blocks: IBlock[]) {
        const {workspaceTree, boardTree} = this.state

        let newState = {workspaceTree, boardTree}

        const newWorkspaceTree = MutableWorkspaceTree.incrementalUpdate(workspaceTree, blocks)
        if (newWorkspaceTree) {
            newState = {...newState, workspaceTree: newWorkspaceTree}
        }

        let newBoardTree: BoardTree | undefined
        if (boardTree) {
            newBoardTree = await MutableBoardTree.incrementalUpdate(boardTree, blocks)
        } else if (this.props.match.params.boardId) {
            // Corner case: When the page is viewing a deleted board, that is subsequently un-deleted on another client
            newBoardTree = await MutableBoardTree.sync(this.props.match.params.boardId || '', this.props.match.params.viewId || '')
        }

        if (newBoardTree) {
            newState = {...newState, boardTree: newBoardTree}
        } else {
            newState = {...newState, boardTree: undefined}
        }

        // Update url with viewId if it's different
        if (newBoardTree && newBoardTree.activeView.id !== this.props.match.params.viewId) {
            const newPath = generatePath(this.props.match.path, {...this.props.match.params, viewId: newBoardTree?.activeView.id})
            this.props.history.push(newPath)
        }

        this.setState(newState)
    }

    // IPageController
    async setSearchText(text?: string): Promise<void> {
        if (!this.state.boardTree) {
            Utils.assertFailure('setSearchText: boardTree')
            return
        }

        const newBoardTree = await this.state.boardTree.copyWithSearchText(text)
        this.setState({boardTree: newBoardTree})
    }
}

export default withRouter(injectIntl(BoardPage))
