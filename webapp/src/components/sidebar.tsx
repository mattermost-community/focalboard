// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Archiver} from '../archiver'
import {Board, MutableBoard} from '../blocks/board'
import {BoardTree} from '../viewModel/boardTree'
import mutator from '../mutator'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import {WorkspaceTree} from '../viewModel/workspaceTree'
import {BoardView} from '../blocks/boardView'

type Props = {
    showBoard: (id: string) => void
    showView: (id: string, boardId?: string) => void
    workspaceTree: WorkspaceTree,
    boardTree?: BoardTree
}

type State = {
    isHidden: boolean
}

class Sidebar extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {isHidden: false}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): JSX.Element {
        const {workspaceTree} = this.props
        if (!workspaceTree) {
            return <div/>
        }

        const {boards, views} = workspaceTree

        if (this.state.isHidden) {
            const hamburgerRef = React.createRef<HTMLDivElement>()
            return (
                <div className='octo-sidebar hidden'>
                    <div className='octo-sidebar-header'>
                        <div
                            className='octo-button square'
                            onClick={() => this.showClicked()}
                        >
                            <div
                                ref={hamburgerRef}
                                className='imageHamburger'
                                onMouseOver={() => {
                                    hamburgerRef.current.className = 'imageShowSidebar'
                                }}
                                onMouseOut={() => {
                                    hamburgerRef.current.className = 'imageHamburger'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className='octo-sidebar'>
                <div className='octo-sidebar-header octo-hover-container'>
                    {'OCTO'}
                    <div className='octo-spacer'/>
                    <div
                        className='octo-button square octo-hover-item'
                        onClick={() => this.hideClicked()}
                    ><div className='imageHideSidebar'/></div>
                </div>
                {
                    boards.map((board) => {
                        const displayTitle = board.title || '(Untitled Board)'
                        const boardViews = views.filter((view) => view.parentId === board.id)
                        return (
                            <div key={board.id}>
                                <div className='octo-sidebar-item octo-hover-container'>
                                    <div
                                        className='octo-sidebar-title'
                                        onClick={() => {
                                            this.boardClicked(board)
                                        }}
                                    >
                                        {board.icon ? `${board.icon} ${displayTitle}` : displayTitle}
                                    </div>
                                    <div className='octo-spacer'/>
                                    <MenuWrapper>
                                        <div className='octo-button square octo-hover-item'><div className='imageOptions'/></div>
                                        <Menu>
                                            <Menu.Text
                                                id='delete'
                                                name='Delete board'
                                                onClick={async () => {
                                                    const nextBoardId = boards.length > 1 ? boards.find((o) => o.id !== board.id).id : undefined
                                                    mutator.deleteBlock(
                                                        board,
                                                        'delete block',
                                                        async () => {
                                                            nextBoardId && this.props.showBoard(nextBoardId!)
                                                        },
                                                        async () => {
                                                            this.props.showBoard(board.id)
                                                        },
                                                    )
                                                }}
                                            />
                                        </Menu>
                                    </MenuWrapper>
                                </div>
                                {boardViews.map((view) => {
                                    return (<div
                                        key={view.id}
                                        className='octo-sidebar-item subitem octo-hover-container'
                                    >
                                        <div
                                            className='octo-sidebar-title'
                                            onClick={() => {
                                                this.viewClicked(board, view)
                                            }}
                                        >
                                            {view.title || '(Untitled View)'}
                                        </div>
                                    </div>)
                                })}
                            </div>
                        )
                    })
                }

                <br/>

                <div
                    className='octo-button'
                    onClick={() => {
                        this.addBoardClicked()
                    }}
                >+ Add Board</div>

                <div className='octo-spacer'/>

                <MenuWrapper>
                    <div className='octo-button'>Settings</div>
                    <Menu position='top'>
                        <Menu.Text
                            id='import'
                            name='Import Archive'
                            onClick={async () => Archiver.importFullArchive(() => {
                                this.forceUpdate()
                            })}
                        />
                        <Menu.Text
                            id='export'
                            name='Export Archive'
                            onClick={async () => Archiver.exportFullArchive()}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
        )
    }

    private boardClicked(board: Board): void {
        this.props.showBoard(board.id)
    }

    private viewClicked(board: Board, view: BoardView): void {
        this.props.showView(view.id, board.id)
    }

    async addBoardClicked(): Promise<void> {
        const {boardTree, showBoard} = this.props

        const oldBoardId = boardTree?.board?.id
        const board = new MutableBoard()
        await mutator.insertBlock(
            board,
            'add board',
            async () => {
                showBoard(board.id)
            },
            async () => {
                if (oldBoardId) {
                    showBoard(oldBoardId)
                }
            })

        await mutator.insertBlock(board)
    }

    private hideClicked() {
        this.setState({isHidden: true})
    }

    private showClicked() {
        this.setState({isHidden: false})
    }
}

export {Sidebar}
