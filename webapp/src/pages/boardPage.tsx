// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {BoardView} from '../blocks/boardView'
import {MutableBoardTree} from '../viewModel/boardTree'
import {WorkspaceComponent} from '../components/workspaceComponent'
import {FlashMessage} from '../flashMessage'
import mutator from '../mutator'
import {OctoListener} from '../octoListener'
import {Utils} from '../utils'
import {MutableWorkspaceTree} from '../viewModel/workspaceTree'

type Props = {
    setLanguage: (lang: string) => void
}

type State = {
    boardId: string
    viewId: string
    workspaceTree: MutableWorkspaceTree
    boardTree?: MutableBoardTree
}

export default class BoardPage extends React.Component<Props, State> {
    view: BoardView

    updateTitleTimeout: number
    updatePropertyLabelTimeout: number

    private workspaceListener = new OctoListener()

    constructor(props: Props) {
        super(props)
        const queryString = new URLSearchParams(window.location.search)
        const boardId = queryString.get('id')
        const viewId = queryString.get('v')

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

    undoRedoHandler = async (e: KeyboardEvent) => {
        if (e.target !== document.body) {
            return
        }

        if (e.keyCode === 90 && !e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) { // Cmd+Z
            Utils.log('Undo')
            if (mutator.canUndo) {
                const description = mutator.undoDescription
                await mutator.undo()
                if (description) {
                    FlashMessage.show(`Undo ${description}`)
                } else {
                    FlashMessage.show('Undo')
                }
            } else {
                FlashMessage.show('Nothing to Undo', 800, 'background-color: #909050;')
            }
        } else if (e.keyCode === 90 && e.shiftKey && (e.ctrlKey || e.metaKey) && !e.altKey) { // Shift+Cmd+Z
            Utils.log('Redo')
            if (mutator.canRedo) {
                const description = mutator.redoDescription
                await mutator.redo()
                if (description) {
                    FlashMessage.show(`Redo ${description}`)
                } else {
                    FlashMessage.show('Redo')
                }
            } else {
                FlashMessage.show('Nothing to Redo', 800, 'background-color: #909050;')
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
        const {workspaceTree} = this.state
        Utils.log(`sync start: ${boardId}`)

        await workspaceTree.sync()
        const boardIds = workspaceTree.boards.map((o) => o.id)
        // Listen to boards plus all blocks at root (Empty string for parentId)
        this.workspaceListener.open(['', ...boardIds], async (blockId) => {
            Utils.log(`workspaceListener.onChanged: ${blockId}`)
            this.sync()
        })

        if (boardId) {
            const boardTree = new MutableBoardTree(boardId)
            await boardTree.sync()

            // Default to first view
            if (!viewId) {
                viewId = boardTree.views[0].id
            }

            boardTree.setActiveView(viewId)

            // TODO: Handle error (viewId not found)
            this.setState({
                ...this.state,
                boardTree,
                boardId,
                viewId: boardTree.activeView.id,
            })
            Utils.log(`sync complete: ${boardTree.board.id} (${boardTree.board.title})`)
        } else {
            this.forceUpdate()
        }
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
        if (this.state.boardId === boardId) {
            this.state.boardTree.setActiveView(viewId)
            this.setState({...this.state, viewId})
        } else {
            this.attachToBoard(boardId, viewId)
        }

        const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + `?id=${encodeURIComponent(boardId)}&v=${encodeURIComponent(viewId)}`
        window.history.pushState({path: newUrl}, '', newUrl)
    }

    setSearchText(text?: string): void {
        this.state.boardTree?.setSearchText(text)
        this.setState({...this.state, boardTree: this.state.boardTree})
    }
}
