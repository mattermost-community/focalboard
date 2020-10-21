// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import { Archiver } from '../archiver'
import { Board, MutableBoard } from '../blocks/board'
import { BoardTree } from '../viewModel/boardTree'
import mutator from '../mutator'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import { WorkspaceTree } from '../viewModel/workspaceTree'


type Props = {
    showBoard: (id: string) => void
    workspaceTree: WorkspaceTree,
    boardTree?: BoardTree
}

class Sidebar extends React.Component<Props> {
    render() {
        const {workspaceTree} = this.props
        if (!workspaceTree) {
            return <div/>
        }

        const {boards} = workspaceTree

        return (
            <div className='octo-sidebar'>
                {
                    boards.map((board) => {
                        const displayTitle = board.title || '(Untitled Board)'
                        return (
                            <div
                                key={board.id}
                                className='octo-sidebar-item octo-hover-container'
                            >
                                <div
                                    className='octo-sidebar-title'
                                    onClick={() => {
                                        this.boardClicked(board)
                                    }}
                                >{board.icon ? `${board.icon} ${displayTitle}` : displayTitle}</div>
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

    private boardClicked(board: Board) {
        this.props.showBoard(board.id)
    }

    async addBoardClicked() {
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
}

export { Sidebar }

