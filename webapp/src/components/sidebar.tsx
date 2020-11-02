// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape, FormattedMessage} from 'react-intl'

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
import DeleteIcon from '../widgets/icons/delete'
import SubmenuTriangleIcon from '../widgets/icons/submenuTriangle'
import DotIcon from '../widgets/icons/dot'
import IconButton from '../widgets/buttons/iconButton'
import Button from '../widgets/buttons/button'
import {WorkspaceTree} from '../viewModel/workspaceTree'
import {BoardView} from '../blocks/boardView'

import './sidebar.scss'

type Props = {
    showBoard: (id: string) => void
    showView: (id: string, boardId?: string) => void
    workspaceTree: WorkspaceTree,
    boardTree?: BoardTree,
    setLanguage: (lang: string) => void,
    intl: IntlShape
}

type State = {
    isHidden: boolean
    collapsedBoards: {[key: string]: boolean}
}

class Sidebar extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {isHidden: false, collapsedBoards: {}}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): JSX.Element {
        const {workspaceTree, intl} = this.props
        if (!workspaceTree) {
            return <div/>
        }

        const {boards, views} = workspaceTree
        const {collapsedBoards} = this.state

        if (this.state.isHidden) {
            return (
                <div className='Sidebar octo-sidebar hidden'>
                    <div className='octo-sidebar-header show-button'>
                        <div className='hamburger-icon'>
                            <IconButton
                                icon={<HamburgerIcon/>}
                                onClick={() => this.showClicked()}
                            />
                        </div>
                        <div className='show-icon'>
                            <IconButton
                                icon={<ShowSidebarIcon/>}
                                onClick={() => this.showClicked()}
                            />
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className='Sidebar octo-sidebar'>
                <div className='octo-sidebar-header'>
                    {'OCTO'}
                    <div className='octo-spacer'/>
                    <IconButton
                        onClick={() => this.hideClicked()}
                        icon={<HideSidebarIcon/>}
                    />
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
                                <div className={'octo-sidebar-item ' + (collapsedBoards[board.id] ? 'collapsed' : 'expanded')}>
                                    <IconButton
                                        icon={<SubmenuTriangleIcon/>}
                                        onClick={() => {
                                            const newCollapsedBoards = {...this.state.collapsedBoards}
                                            newCollapsedBoards[board.id] = !newCollapsedBoards[board.id]
                                            this.setState({collapsedBoards: newCollapsedBoards})
                                        }}
                                    />
                                    <div
                                        className='octo-sidebar-title'
                                        onClick={() => {
                                            this.boardClicked(board)
                                        }}
                                    >
                                        {board.icon ? `${board.icon} ${displayTitle}` : displayTitle}
                                    </div>
                                    <MenuWrapper>
                                        <IconButton icon={<OptionsIcon/>}/>
                                        <Menu>
                                            <Menu.Text
                                                id='delete'
                                                name={intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete Board'})}
                                                icon={<DeleteIcon/>}
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
                                {!collapsedBoards[board.id] && boardViews.length === 0 &&
                                    <div className='octo-sidebar-item subitem no-views'>
                                        <FormattedMessage
                                            id='Sidebar.no-views-in-board'
                                            defaultMessage='No pages inside'
                                        />
                                    </div>}
                                {!collapsedBoards[board.id] && boardViews.map((view) => (
                                    <div
                                        key={view.id}
                                        className='octo-sidebar-item subitem'
                                    >
                                        <DotIcon/>
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
                                    </div>
                                ))}
                            </div>
                        )
                    })
                }

                <br/>

                <Button onClick={() => {this.addBoardClicked()}}>
                    <FormattedMessage
                        id='Sidebar.add-board'
                        defaultMessage='+ Add Board'
                    />
                </Button>

                <div className='octo-spacer'/>

                <MenuWrapper>
                    <Button>
                        <FormattedMessage
                            id='Sidebar.settings'
                            defaultMessage='Settings'
                        />
                    </Button>
                    <Menu position='top'>
                        <Menu.Text
                            id='import'
                            name={intl.formatMessage({id: 'Sidebar.import-archive', defaultMessage: 'Import Archive'})}
                            onClick={async () => Archiver.importFullArchive()}
                        />
                        <Menu.Text
                            id='export'
                            name={intl.formatMessage({id: 'Sidebar.export-archive', defaultMessage: 'Export Archive'})}
                            onClick={async () => Archiver.exportFullArchive()}
                        />
                        <Menu.SubMenu
                            id='lang'
                            name={intl.formatMessage({id: 'Sidebar.set-language', defaultMessage: 'Set Language'})}
                            position='top'
                        >
                            <Menu.Text
                                id='english-lang'
                                name={intl.formatMessage({id: 'Sidebar.english', defaultMessage: 'English'})}
                                onClick={async () => this.props.setLanguage('en')}
                            />
                            <Menu.Text
                                id='spanish-lang'
                                name={intl.formatMessage({id: 'Sidebar.spanish', defaultMessage: 'Spanish'})}
                                onClick={async () => this.props.setLanguage('es')}
                            />
                        </Menu.SubMenu>
                        <Menu.SubMenu
                            id='theme'
                            name={intl.formatMessage({id: 'Sidebar.set-theme', defaultMessage: 'Set Theme'})}
                            position='top'
                        >
                            <Menu.Text
                                id='dark-theme'
                                name={intl.formatMessage({id: 'Sidebar.dark-theme', defaultMessage: 'Dark Theme'})}
                                onClick={async () => setTheme(darkTheme)}
                            />
                            <Menu.Text
                                id='light-theme'
                                name={intl.formatMessage({id: 'Sidebar.light-theme', defaultMessage: 'Light Theme'})}
                                onClick={async () => setTheme(lightTheme)}
                            />
                            <Menu.Text
                                id='mattermost-theme'
                                name={intl.formatMessage({id: 'Sidebar.mattermost-theme', defaultMessage: 'Mattermost Theme'})}
                                onClick={async () => setTheme(mattermostTheme)}
                            />
                        </Menu.SubMenu>
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
            }
        )
    }

    private hideClicked() {
        this.setState({isHidden: true})
    }

    private showClicked() {
        this.setState({isHidden: false})
    }
}

export default injectIntl(Sidebar)
