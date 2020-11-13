// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {Archiver} from '../archiver'
import {Board, MutableBoard} from '../blocks/board'
import {BoardView, MutableBoardView} from '../blocks/boardView'
import mutator from '../mutator'
import {darkTheme, lightTheme, mattermostTheme, setTheme} from '../theme'
import {WorkspaceTree} from '../viewModel/workspaceTree'
import Button from '../widgets/buttons/button'
import IconButton from '../widgets/buttons/iconButton'
import DeleteIcon from '../widgets/icons/delete'
import DotIcon from '../widgets/icons/dot'
import DuplicateIcon from '../widgets/icons/duplicate'
import HamburgerIcon from '../widgets/icons/hamburger'
import HideSidebarIcon from '../widgets/icons/hideSidebar'
import OptionsIcon from '../widgets/icons/options'
import ShowSidebarIcon from '../widgets/icons/showSidebar'
import SubmenuTriangleIcon from '../widgets/icons/submenuTriangle'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'
import './sidebar.scss'

type Props = {
    showBoard: (id: string) => void
    showView: (id: string, boardId?: string) => void
    workspaceTree: WorkspaceTree,
    activeBoardId?: string
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
                                onClick={this.showClicked}
                            />
                        </div>
                        <div className='show-icon'>
                            <IconButton
                                icon={<ShowSidebarIcon/>}
                                onClick={this.showClicked}
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
                        onClick={this.hideClicked}
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
                                        <Menu position='left'>
                                            <Menu.Text
                                                id='deleteBoard'
                                                name={intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete Board'})}
                                                icon={<DeleteIcon/>}
                                                onClick={async () => {
                                                    const nextBoardId = boards.length > 1 ? boards.find((o) => o.id !== board.id)?.id : undefined
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

                                            <Menu.Text
                                                id='duplicateBoard'
                                                name={intl.formatMessage({id: 'Sidebar.duplicate-board', defaultMessage: 'Duplicate Board'})}
                                                icon={<DuplicateIcon/>}
                                                onClick={async () => {
                                                    await mutator.duplicateBoard(
                                                        board.id,
                                                        'duplicate board',
                                                        async (newBoardId) => {
                                                            newBoardId && this.props.showBoard(newBoardId)
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

                <Button
                    onClick={this.addBoardClicked}
                >
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

    private addBoardClicked = async () => {
        const {showBoard, intl} = this.props

        const oldBoardId = this.props.activeBoardId
        const board = new MutableBoard()
        const view = new MutableBoardView()
        view.viewType = 'board'
        view.parentId = board.id
        view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board View'})

        await mutator.insertBlocks(
            [board, view],
            'add board',
            async () => {
                showBoard(board.id)
            },
            async () => {
                if (oldBoardId) {
                    showBoard(oldBoardId)
                }
            },
        )
    }

    private hideClicked = () => {
        this.setState({isHidden: true})
    }

    private showClicked = () => {
        this.setState({isHidden: false})
    }
}

export default injectIntl(Sidebar)
