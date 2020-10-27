// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {Archiver} from '../archiver'
import {mattermostTheme, darkTheme, lightTheme, setTheme} from '../theme'
import {Board, MutableBoard} from '../blocks/board'
import {BoardTree} from '../viewModel/boardTree'
import mutator from '../mutator'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import OptionsIcon from '../widgets/icons/options'
import ShowSidebarIcon from '../widgets/icons/showSidebar'
import HideSidebarIcon from '../widgets/icons/hideSidebar'
import HamburgerIcon from '../widgets/icons/hamburger'
import {WorkspaceTree} from '../viewModel/workspaceTree'
import {BoardView} from '../blocks/boardView'

import './sidebar.scss'

type Props = {
    showBoard: (id: string) => void
    showView: (id: string, boardId?: string) => void
    workspaceTree: WorkspaceTree,
    boardTree?: BoardTree,
    setLanguage: (lang: string) => void,
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
            return (
                <div className='Sidebar octo-sidebar hidden'>
                    <div className='octo-sidebar-header'>
                        <div
                            className='octo-button square show-button'
                            onClick={() => this.showClicked()}
                        >
                            <HamburgerIcon/>
                            <ShowSidebarIcon/>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className='Sidebar octo-sidebar'>
                <div className='octo-sidebar-header octo-hover-container'>
                    {'OCTO'}
                    <div className='octo-spacer'/>
                    <div
                        className='octo-button square octo-hover-item'
                        onClick={() => this.hideClicked()}
                    ><HideSidebarIcon/></div>
                </div>
                {
                    boards.map((board) => {
                        const displayTitle = board.title || (
                            <FormattedMessage
                                id='Sidebar.untitled-board'
                                defaultMessage='(Untitled Board)'
                            />
                        )
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
                                    <MenuWrapper>
                                        <div className='octo-button square octo-hover-item'><OptionsIcon/></div>
                                        <Menu>
                                            <FormattedMessage
                                                id='Sidebar.delete-board'
                                                defaultMessage='Delete Board'
                                            >
                                                {(text: string) => (
                                                    <Menu.Text
                                                        id='delete'
                                                        name={text}
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
                                                )}
                                            </FormattedMessage>
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
                                            {view.title || (
                                                <FormattedMessage
                                                    id='Sidebar.untitled-view'
                                                    defaultMessage='(Untitled View)'
                                                />
                                            )}
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
                >
                    <FormattedMessage
                        id='Sidebar.add-board'
                        defaultMessage='+ Add Board'
                    />
                </div>

                <div className='octo-spacer'/>

                <MenuWrapper>
                    <div className='octo-button'>
                        <FormattedMessage
                            id='Sidebar.settings'
                            defaultMessage='Settings'
                        />
                    </div>
                    <Menu position='top'>
                        <FormattedMessage
                            id='Sidebar.import-archive'
                            defaultMessage='Import Archive'
                        >
                            {(text: string) => (
                                <Menu.Text
                                    id='import'
                                    name={text}
                                    onClick={async () => Archiver.importFullArchive()}
                                />
                            )}
                        </FormattedMessage>
                        <FormattedMessage
                            id='Sidebar.export-archive'
                            defaultMessage='Export Archive'
                        >
                            {(text: string) => (
                                <Menu.Text
                                    id='export'
                                    name={text}
                                    onClick={async () => Archiver.exportFullArchive()}
                                />
                            )}
                        </FormattedMessage>
                        <FormattedMessage
                            id='Sidebar.set-english-language'
                            defaultMessage='Set English Language'
                        >
                            {(text: string) => (
                                <Menu.Text
                                    id='english-lang'
                                    name={text}
                                    onClick={async () => this.props.setLanguage('en')}
                                />
                            )}
                        </FormattedMessage>
                        <FormattedMessage
                            id='Sidebar.set-spanish-language'
                            defaultMessage='Set Spanish Language'
                        >
                            {(text: string) => (
                                <Menu.Text
                                    id='spanish-lang'
                                    name={text}
                                    onClick={async () => this.props.setLanguage('es')}
                                />
                            )}
                        </FormattedMessage>
                        <FormattedMessage
                            id='Sidebar.set-dark-theme'
                            defaultMessage='Set Dark Theme'
                        >
                            {(text: string) => (
                                <Menu.Text
                                    id='dark-theme'
                                    name={text}
                                    onClick={async () => setTheme(darkTheme)}
                                />
                            )}
                        </FormattedMessage>
                        <FormattedMessage
                            id='Sidebar.set-light-theme'
                            defaultMessage='Set Light Theme'
                        >
                            {(text: string) => (
                                <Menu.Text
                                    id='light-theme'
                                    name={text}
                                    onClick={async () => setTheme(lightTheme)}
                                />
                            )}
                        </FormattedMessage>
                        <FormattedMessage
                            id='Sidebar.set-mattermost-theme'
                            defaultMessage='Set Mattermost Theme'
                        >
                            {(text: string) => (
                                <Menu.Text
                                    id='mattermost-theme'
                                    name={text}
                                    onClick={async () => setTheme(mattermostTheme)}
                                />
                            )}
                        </FormattedMessage>
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
