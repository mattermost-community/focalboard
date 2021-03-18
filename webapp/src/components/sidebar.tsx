// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {Archiver} from '../archiver'
import {Board, MutableBoard} from '../blocks/board'
import {BoardView, IViewType, MutableBoardView} from '../blocks/boardView'
import {Constants} from '../constants'
import mutator from '../mutator'
import octoClient from '../octoClient'
import {darkTheme, defaultTheme, lightTheme, loadTheme, setTheme, Theme} from '../theme'
import {IUser, UserContext} from '../user'
import {WorkspaceTree} from '../viewModel/workspaceTree'
import Button from '../widgets/buttons/button'
import IconButton from '../widgets/buttons/iconButton'
import BoardIcon from '../widgets/icons/board'
import DeleteIcon from '../widgets/icons/delete'
import EditIcon from '../widgets/icons/edit'
import DisclosureTriangle from '../widgets/icons/disclosureTriangle'
import DuplicateIcon from '../widgets/icons/duplicate'
import HamburgerIcon from '../widgets/icons/hamburger'
import HideSidebarIcon from '../widgets/icons/hideSidebar'
import LogoWithNameIcon from '../widgets/icons/logoWithName'
import LogoWithNameWhiteIcon from '../widgets/icons/logoWithNameWhite'
import OptionsIcon from '../widgets/icons/options'
import ShowSidebarIcon from '../widgets/icons/showSidebar'
import TableIcon from '../widgets/icons/table'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import ModalWrapper from './modalWrapper'
import RegistrationLinkComponent from './registrationLinkComponent'
import './sidebar.scss'

type Props = {
    showBoard: (id?: string) => void
    showView: (id: string, boardId?: string) => void
    workspaceTree: WorkspaceTree,
    activeBoardId?: string
    setLanguage: (lang: string) => void,
    intl: IntlShape
}

type State = {
    isHidden: boolean
    collapsedBoards: {[key: string]: boolean}
    showRegistrationLinkDialog?: boolean
    whiteLogo: boolean
}

class Sidebar extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {isHidden: false, collapsedBoards: {}, whiteLogo: false}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidMount(): void {
        this.updateLogo()
    }

    private updateLogo() {
        const theme = loadTheme()
        const whiteLogo = theme.sidebarWhiteLogo === 'true'
        if (this.state.whiteLogo !== whiteLogo) {
            this.setState({whiteLogo})
        }
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
                    <div className='heading'>
                        <UserContext.Consumer>
                            {(user) => {
                                return this.renderUserMenu(user)
                            }}
                        </UserContext.Consumer>
                    </div>

                    <div className='octo-spacer'/>
                    <IconButton
                        onClick={this.hideClicked}
                        icon={<HideSidebarIcon/>}
                    />
                </div>
                <div className='octo-sidebar-list'>
                    {
                        boards.map((board) => {
                            const displayTitle: string = board.title || intl.formatMessage({id: 'Sidebar.untitled-board', defaultMessage: '(Untitled Board)'})
                            const boardViews = views.filter((view) => view.parentId === board.id)
                            return (
                                <div key={board.id}>
                                    <div className={'octo-sidebar-item ' + (collapsedBoards[board.id] ? 'collapsed' : 'expanded')}>
                                        <IconButton
                                            icon={<DisclosureTriangle/>}
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
                                            title={displayTitle}
                                        >
                                            {board.icon ? `${board.icon} ${displayTitle}` : displayTitle}
                                        </div>
                                        <MenuWrapper>
                                            <IconButton icon={<OptionsIcon/>}/>
                                            <Menu position='left'>
                                                <Menu.Text
                                                    id='deleteBoard'
                                                    name={intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete board'})}
                                                    icon={<DeleteIcon/>}
                                                    onClick={async () => {
                                                        const nextBoardId = boards.length > 1 ? boards.find((o) => o.id !== board.id)?.id : undefined
                                                        mutator.deleteBlock(
                                                            board,
                                                            intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete board'}),
                                                            async () => {
                                                                // This delay is needed because OctoListener has a default 100 ms notification delay before updates
                                                                setTimeout(() => {
                                                                    this.props.showBoard(nextBoardId)
                                                                }, 120)
                                                            },
                                                            async () => {
                                                                this.props.showBoard(board.id)
                                                            },
                                                        )
                                                    }}
                                                />

                                                <Menu.Text
                                                    id='duplicateBoard'
                                                    name={intl.formatMessage({id: 'Sidebar.duplicate-board', defaultMessage: 'Duplicate board'})}
                                                    icon={<DuplicateIcon/>}
                                                    onClick={() => {
                                                        this.duplicateBoard(board.id)
                                                    }}
                                                />

                                                <Menu.Text
                                                    id='templateFromBoard'
                                                    name={intl.formatMessage({id: 'Sidebar.template-from-board', defaultMessage: 'New template from board'})}
                                                    onClick={() => {
                                                        this.addTemplateFromBoard(board.id)
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
                                            {this.iconForViewType(view.viewType)}
                                            <div
                                                className='octo-sidebar-title'
                                                onClick={() => {
                                                    this.viewClicked(board, view)
                                                }}
                                                title={view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                                            >
                                                {view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })
                    }
                </div>

                <div className='octo-spacer'/>

                <MenuWrapper>
                    <Button>
                        <FormattedMessage
                            id='Sidebar.add-board'
                            defaultMessage='+ Add Board'
                        />
                    </Button>
                    <Menu position='top'>
                        {workspaceTree.boardTemplates.length > 0 && <>
                            <Menu.Label>
                                <b>
                                    <FormattedMessage
                                        id='Sidebar.select-a-template'
                                        defaultMessage='Select a template'
                                    />
                                </b>
                            </Menu.Label>

                            <Menu.Separator/>
                        </>}

                        {workspaceTree.boardTemplates.map((boardTemplate) => {
                            const displayName = boardTemplate.title || intl.formatMessage({id: 'Sidebar.untitled', defaultMessage: 'Untitled'})

                            return (
                                <Menu.Text
                                    key={boardTemplate.id}
                                    id={boardTemplate.id}
                                    name={displayName}
                                    icon={<div className='Icon'>{boardTemplate.icon}</div>}
                                    onClick={() => {
                                        this.addBoardFromTemplate(boardTemplate.id)
                                    }}
                                    rightIcon={
                                        <MenuWrapper stopPropagationOnToggle={true}>
                                            <IconButton icon={<OptionsIcon/>}/>
                                            <Menu position='left'>
                                                <Menu.Text
                                                    icon={<EditIcon/>}
                                                    id='edit'
                                                    name={intl.formatMessage({id: 'Sidebar.edit-template', defaultMessage: 'Edit'})}
                                                    onClick={() => {
                                                        this.props.showBoard(boardTemplate.id)
                                                    }}
                                                />
                                                <Menu.Text
                                                    icon={<DeleteIcon/>}
                                                    id='delete'
                                                    name={intl.formatMessage({id: 'Sidebar.delete-template', defaultMessage: 'Delete'})}
                                                    onClick={async () => {
                                                        await mutator.deleteBlock(boardTemplate, 'delete board template')
                                                    }}
                                                />
                                            </Menu>
                                        </MenuWrapper>
                                    }
                                />
                            )
                        })}

                        <Menu.Text
                            id='empty-template'
                            name={intl.formatMessage({id: 'Sidebar.empty-board', defaultMessage: 'Empty board'})}
                            icon={<BoardIcon/>}
                            onClick={this.addBoardClicked}
                        />

                        <Menu.Text
                            id='add-template'
                            name={intl.formatMessage({id: 'Sidebar.add-template', defaultMessage: '+ New template'})}
                            onClick={this.addBoardTemplateClicked}
                        />
                    </Menu>
                </MenuWrapper>

                <MenuWrapper>
                    <div className='octo-sidebar-item subitem'>
                        <FormattedMessage
                            id='Sidebar.settings'
                            defaultMessage='Settings'
                        />
                    </div>
                    <Menu position='top'>
                        <Menu.Text
                            id='import'
                            name={intl.formatMessage({id: 'Sidebar.import-archive', defaultMessage: 'Import archive'})}
                            onClick={async () => Archiver.importFullArchive()}
                        />
                        <Menu.Text
                            id='export'
                            name={intl.formatMessage({id: 'Sidebar.export-archive', defaultMessage: 'Export archive'})}
                            onClick={async () => Archiver.exportFullArchive()}
                        />
                        <Menu.SubMenu
                            id='lang'
                            name={intl.formatMessage({id: 'Sidebar.set-language', defaultMessage: 'Set language'})}
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
                            name={intl.formatMessage({id: 'Sidebar.set-theme', defaultMessage: 'Set theme'})}
                            position='top'
                        >
                            <Menu.Text
                                id='default-theme'
                                name={intl.formatMessage({id: 'Sidebar.default-theme', defaultMessage: 'Default theme'})}
                                onClick={async () => this.updateTheme(defaultTheme)}
                            />
                            <Menu.Text
                                id='dark-theme'
                                name={intl.formatMessage({id: 'Sidebar.dark-theme', defaultMessage: 'Dark theme'})}
                                onClick={async () => this.updateTheme(darkTheme)}
                            />
                            <Menu.Text
                                id='light-theme'
                                name={intl.formatMessage({id: 'Sidebar.light-theme', defaultMessage: 'Light theme'})}
                                onClick={async () => this.updateTheme(lightTheme)}
                            />
                        </Menu.SubMenu>
                    </Menu>
                </MenuWrapper>
            </div>
        )
    }

    private updateTheme(theme: Theme) {
        setTheme(theme)
        const whiteLogo = (theme.sidebarWhiteLogo === 'true')
        this.setState({whiteLogo})
    }

    private renderUserMenu(user?: IUser): JSX.Element {
        const {intl} = this.props

        return (
            <ModalWrapper>
                <MenuWrapper>
                    <div className='logo'>
                        {this.state.whiteLogo ? <LogoWithNameWhiteIcon/> : <LogoWithNameIcon/>}
                        <div className='octo-spacer'/>
                        <div className='version'>
                            {`v${Constants.versionString}`}
                        </div>
                    </div>
                    <Menu>
                        {user && user.username !== 'single-user' && <>
                            <Menu.Label><b>{user.username}</b></Menu.Label>
                            <Menu.Text
                                id='logout'
                                name={intl.formatMessage({id: 'Sidebar.logout', defaultMessage: 'Log out'})}
                                onClick={async () => {
                                    octoClient.logout()
                                    window.location.href = '/login'
                                }}
                            />
                            <Menu.Text
                                id='changePassword'
                                name={intl.formatMessage({id: 'Sidebar.changePassword', defaultMessage: 'Change password'})}
                                onClick={async () => {
                                    window.location.href = '/change_password'
                                }}
                            />
                            <Menu.Text
                                id='invite'
                                name={intl.formatMessage({id: 'Sidebar.invite-users', defaultMessage: 'Invite Users'})}
                                onClick={async () => {
                                    this.setState({showRegistrationLinkDialog: true})
                                }}
                            />

                            <Menu.Separator/>
                        </>}

                        <Menu.Text
                            id='about'
                            name={intl.formatMessage({id: 'Sidebar.about', defaultMessage: 'About Focalboard'})}
                            onClick={async () => {
                                this.showAbout()
                            }}
                        />
                    </Menu>
                </MenuWrapper>

                {this.state.showRegistrationLinkDialog &&
                    <RegistrationLinkComponent
                        onClose={() => {
                            this.setState({showRegistrationLinkDialog: false})
                        }}
                    />
                }
            </ModalWrapper>
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
        board.rootId = board.id

        const view = new MutableBoardView()
        view.viewType = 'board'
        view.parentId = board.id
        view.rootId = board.rootId
        view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})

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

    private iconForViewType(viewType: IViewType): JSX.Element {
        switch (viewType) {
        case 'board': return <BoardIcon/>
        case 'table': return <TableIcon/>
        default: return <div/>
        }
    }

    private async addBoardFromTemplate(boardTemplateId: string) {
        const oldBoardId = this.props.activeBoardId

        await mutator.duplicateBoard(
            boardTemplateId,
            this.props.intl.formatMessage({id: 'Mutator.new-board-from-template', defaultMessage: 'new board from template'}),
            false,
            async (newBoardId) => {
                this.props.showBoard(newBoardId)
            },
            async () => {
                if (oldBoardId) {
                    this.props.showBoard(oldBoardId)
                }
            },
        )
    }

    private async duplicateBoard(boardId: string) {
        const oldBoardId = this.props.activeBoardId

        await mutator.duplicateBoard(
            boardId,
            this.props.intl.formatMessage({id: 'Mutator.duplicate-board', defaultMessage: 'duplicate board'}),
            false,
            async (newBoardId) => {
                this.props.showBoard(newBoardId)
            },
            async () => {
                if (oldBoardId) {
                    this.props.showBoard(oldBoardId)
                }
            },
        )
    }

    private async addTemplateFromBoard(boardId: string) {
        const oldBoardId = this.props.activeBoardId

        await mutator.duplicateBoard(
            boardId,
            this.props.intl.formatMessage({id: 'Mutator.new-template-from-board', defaultMessage: 'new template from board'}),
            true,
            async (newBoardId) => {
                this.props.showBoard(newBoardId)
            },
            async () => {
                if (oldBoardId) {
                    this.props.showBoard(oldBoardId)
                }
            },
        )
    }

    private addBoardTemplateClicked = async () => {
        const {activeBoardId} = this.props

        const boardTemplate = new MutableBoard()
        boardTemplate.rootId = boardTemplate.id
        boardTemplate.isTemplate = true
        await mutator.insertBlock(
            boardTemplate,
            'add board template',
            async () => {
                this.props.showBoard(boardTemplate.id)
            }, async () => {
                if (activeBoardId) {
                    this.props.showBoard(activeBoardId)
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

    private showAbout = () => {
        const url = 'https://www.focalboard.com?utm_source=webapp'
        window.open(url, '_blank')
    }
}

export default injectIntl(Sidebar)
