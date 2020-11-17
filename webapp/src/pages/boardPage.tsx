// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {IBlock} from '../blocks/block'
import {sendFlashMessage} from '../components/flashMessages'
import {WorkspaceComponent} from '../components/workspaceComponent'
import mutator from '../mutator'
import {OctoListener} from '../octoListener'
import {Utils} from '../utils'
import {BoardTree, MutableBoardTree} from '../viewModel/boardTree'
import {MutableWorkspaceTree, WorkspaceTree} from '../viewModel/workspaceTree'

type Props = {
    setLanguage: (lang: string) => void
}

type State = {
    boardId: string
    viewId: string
    workspaceTree: WorkspaceTree
    boardTree?: BoardTree
}

export default class BoardPage extends React.Component<Props, State> {
    private workspaceListener = new OctoListener()

    constructor(props: Props) {
        super(props)
        const queryString = new URLSearchParams(window.location.search)
        const boardId = queryString.get('id') || ''
        const viewId = queryString.get('v') || ''

        this.state = {
            boardId,
            viewId,
            workspaceTree: new MutableWorkspaceTree(),
        }

        Utils.log(`BoardPage. boardId: ${boardId}`)
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
            document.title = `${board?.title} | ${activeView?.title}`
        }
    }

    private undoRedoHandler = async (e: KeyboardEvent) => {
        if (e.target !== document.body) {
            return
        }

        if (e.keyCode === 90 && !e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) { // Cmd+Z
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
        } else if (e.keyCode === 90 && e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) { // Shift+Cmd+Z
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
        document.addEventListener('keydown', this.undoRedoHandler)
        if (this.state.boardId) {
            this.attachToBoard(this.state.boardId, this.state.viewId)
        } else {
            this.sync()
        }
    }

    componentWillUnmount(): void {
        Utils.log(`boardPage.componentWillUnmount: ${this.state.boardId}`)
        this.workspaceListener.close()
        document.removeEventListener('keydown', this.undoRedoHandler)
    }

    render(): JSX.Element {
        const {workspaceTree} = this.state

        Utils.log(`BoardPage.render ${this.state.boardTree?.board?.title}`)
        return (
            <div className='BoardPage'>
                <WorkspaceComponent
                    workspaceTree={workspaceTree}
                    boardTree={this.state.boardTree}
                    showView={(id, boardId) => {
                        this.showView(id, boardId)
                    }}
                    showBoard={(id) => {
                        this.showBoard(id)
                    }}
                    setSearchText={(text) => {
                        this.setSearchText(text)
                    }}
                    setLanguage={this.props.setLanguage}
                />
            </div>
        )
    }

    private async attachToBoard(boardId: string, viewId?: string) {
        Utils.log(`attachToBoard: ${boardId}`)
        this.sync(boardId, viewId)
    }

    private async sync(boardId: string = this.state.boardId, viewId: string | undefined = this.state.viewId) {
        Utils.log(`sync start: ${boardId}`)

        const workspaceTree = new MutableWorkspaceTree()
        await workspaceTree.sync()
        const boardIds = workspaceTree.boards.map((o) => o.id)
        this.setState({workspaceTree})

        // Listen to boards plus all blocks at root (Empty string for parentId)
        this.workspaceListener.open(
            ['', ...boardIds],
            async (blocks) => {
                Utils.log(`workspaceListener.onChanged: ${blocks.length}`)
                this.incrementalUpdate(blocks)
            },
            () => {
                Utils.log('workspaceListener.onReconnect')
                this.sync()
            },
        )

        if (boardId) {
            const boardTree = new MutableBoardTree(boardId)
            await boardTree.sync()

            // Default to first view
            boardTree.setActiveView(viewId || boardTree.views[0].id)

            // TODO: Handle error (viewId not found)

            this.setState({
                boardTree,
                boardId,
                viewId: boardTree.activeView!.id,
            })
            Utils.log(`sync complete: ${boardTree.board.id} (${boardTree.board.title})`)
        }
    }

    private incrementalUpdate(blocks: IBlock[]) {
        const {workspaceTree, boardTree} = this.state

        let newState = {workspaceTree, boardTree}

        const newWorkspaceTree = workspaceTree.mutableCopy()
        if (newWorkspaceTree.incrementalUpdate(blocks)) {
            newState = {...newState, workspaceTree: newWorkspaceTree}
        }

        const newBoardTree = boardTree ? boardTree.mutableCopy() : new MutableBoardTree(this.state.boardId)
        if (newBoardTree.incrementalUpdate(blocks)) {
            newBoardTree.setActiveView(this.state.viewId)
            newState = {...newState, boardTree: newBoardTree}
        }

        this.setState(newState)
    }

    // IPageController
    showBoard(boardId: string): void {
        const {boardTree} = this.state

        if (boardTree?.board?.id === boardId) {
            return
        }

        const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + `?id=${encodeURIComponent(boardId)}`
        window.history.pushState({path: newUrl}, '', newUrl)

        this.attachToBoard(boardId)
    }

    showView(viewId: string, boardId: string = this.state.boardId): void {
        if (this.state.boardTree && this.state.boardId === boardId) {
            const newBoardTree = this.state.boardTree.mutableCopy()
            newBoardTree.setActiveView(viewId)
            this.setState({boardTree: newBoardTree, viewId})
        } else {
            this.attachToBoard(boardId, viewId)
        }

        const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + `?id=${encodeURIComponent(boardId)}&v=${encodeURIComponent(viewId)}`
        window.history.pushState({path: newUrl}, '', newUrl)
    }

    setSearchText(text?: string): void {
        if (!this.state.boardTree) {
            Utils.assertFailure('setSearchText: boardTree')
            return
        }

        const newBoardTree = this.state.boardTree.mutableCopy()
        newBoardTree.setSearchText(text)
        this.setState({boardTree: newBoardTree})
    }
}
