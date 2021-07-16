// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {connect} from 'react-redux'
import {PayloadAction} from '@reduxjs/toolkit'
import {FormattedMessage} from 'react-intl'
import {generatePath, withRouter, RouteComponentProps} from 'react-router-dom'
import HotKeys from 'react-hot-keys'

import {IUser} from '../user'
import {IWorkspace} from '../blocks/workspace'
import {IBlock} from '../blocks/block'
import {sendFlashMessage} from '../components/flashMessages'
import Workspace from '../components/workspace'
import WSConnection from '../components/wsconnection'
import mutator from '../mutator'
import octoClient from '../octoClient'
import {Utils} from '../utils'
import {BoardTree, MutableBoardTree} from '../viewModel/boardTree'
import './boardPage.scss'
import {fetchCurrentWorkspaceUsers, getCurrentWorkspaceUsersById} from '../store/currentWorkspaceUsers'
import {fetchCurrentWorkspace, getCurrentWorkspace} from '../store/currentWorkspace'
import {fetchBoards} from '../store/boards'
import {fetchViews} from '../store/views'
import {RootState} from '../store'

type Props = RouteComponentProps<{workspaceId?: string, boardId?: string, viewId?: string}> & {
    readonly?: boolean
    usersById: {[key: string]: IUser}
    fetchCurrentWorkspaceUsers: () => void
    fetchBoards: () => void
    fetchViews: () => void
    fetchCurrentWorkspace: () => Promise<PayloadAction<any>>
    workspace: IWorkspace | null,
}

type State = {
    boardTree?: BoardTree
    syncFailed?: boolean
    websocketClosedTimeOutId?: ReturnType<typeof setTimeout>
    websocketClosed?: boolean
}

class BoardPage extends React.Component<Props, State> {
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

        this.state = {}

        Utils.log(`BoardPage. boardId: ${props.match.params.boardId}`)
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidUpdate(prevProps: Props, prevState: State): void {
        Utils.log('componentDidUpdate')
        const board = this.state.boardTree?.board
        const prevBoard = prevState.boardTree?.board

        const workspaceId = this.props.match.params.workspaceId
        const prevWorkspaceId = prevProps.match.params.workspaceId
        const boardId = this.props.match.params.boardId
        const prevBoardId = prevProps.match.params.boardId
        const viewId = this.props.match.params.viewId
        const prevViewId = prevProps.match.params.viewId

        if (boardId && (boardId !== prevBoardId || viewId !== prevViewId)) {
            this.attachToBoard(boardId, viewId)
        }

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
        if (workspaceId !== prevWorkspaceId) {
            if (!this.props.readonly) {
                this.props.fetchCurrentWorkspace().then((result) => {
                    if (!result.payload) {
                        this.props.history.push(Utils.buildURL('/error?id=no_workspace'))
                    }
                })
            }

            this.props.fetchCurrentWorkspaceUsers()
        }
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
        if (!this.props.readonly) {
            this.props.fetchCurrentWorkspace().then((result) => {
                if (!result.payload) {
                    this.props.history.push(Utils.buildURL('/error?id=no_workspace'))
                }
            })
        }

        if (this.props.match.params.boardId) {
            this.attachToBoard(this.props.match.params.boardId, this.props.match.params.viewId)
        } else {
            this.sync()
        }
    }

    render(): JSX.Element {
        Utils.log(`BoardPage.render (workspace ${this.props.match.params.workspaceId || '0'}) ${this.state.boardTree?.board?.title}`)

        // TODO: Make this less brittle. This only works because this is the root render function
        octoClient.workspaceId = this.props.match.params.workspaceId || '0'

        if (this.props.readonly && this.state.syncFailed) {
            Utils.log('BoardPage.render: sync failed')
            return (
                <div className='BoardPage'>
                    <div className='error'>
                        <FormattedMessage
                            id='BoardPage.syncFailed'
                            defaultMessage='Board may be deleted or access revoked.'
                        />
                    </div>
                </div>
            )
        }

        return (
            <div className='BoardPage'>
                <HotKeys
                    keyName='shift+ctrl+z,shift+cmd+z,ctrl+z,cmd+z'
                    onKeyDown={this.undoRedoHandler}
                />
                <WSConnection onBlocksChange={this.incrementalUpdate}/>

                <Workspace
                    boardTree={this.state.boardTree}
                    setSearchText={(text) => {
                        this.setSearchText(text)
                    }}
                    readonly={this.props.readonly || false}
                />
            </div>
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

        this.props.fetchBoards()
        this.props.fetchViews()

        if (this.props.match.params.boardId) {
            const boardTree = await MutableBoardTree.sync(this.props.match.params.boardId || '', this.props.match.params.viewId || '', this.props.usersById)

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

    incrementalUpdate = async (blocks: IBlock[]) => {
        const {boardTree} = this.state

        let newBoardTree: BoardTree | undefined
        if (boardTree) {
            newBoardTree = await MutableBoardTree.incrementalUpdate(boardTree, blocks, this.props.usersById)
        } else if (this.props.match.params.boardId) {
            // Corner case: When the page is viewing a deleted board, that is subsequently un-deleted on another client
            newBoardTree = await MutableBoardTree.sync(this.props.match.params.boardId || '', this.props.match.params.viewId || '', this.props.usersById)
        }

        if (newBoardTree) {
            this.setState({boardTree: newBoardTree})
        } else {
            this.setState({boardTree: undefined})
        }

        // Update url with viewId if it's different
        if (newBoardTree && newBoardTree.activeView.id !== this.props.match.params.viewId) {
            const newPath = generatePath(this.props.match.path, {...this.props.match.params, viewId: newBoardTree?.activeView.id})
            this.props.history.push(newPath)
        }
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

export default connect((state: RootState) => ({usersById: getCurrentWorkspaceUsersById(state), workspace: getCurrentWorkspace(state)}), {fetchCurrentWorkspaceUsers, fetchCurrentWorkspace, fetchBoards, fetchViews})(withRouter(BoardPage))
