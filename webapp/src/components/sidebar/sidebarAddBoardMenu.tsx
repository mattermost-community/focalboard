// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {Board, MutableBoard} from '../../blocks/board'
import {MutableBoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import octoClient from '../../octoClient'
import {GlobalTemplateTree, MutableGlobalTemplateTree} from '../../viewModel/globalTemplateTree'
import {WorkspaceTree} from '../../viewModel/workspaceTree'
import IconButton from '../../widgets/buttons/iconButton'
import BoardIcon from '../../widgets/icons/board'
import DeleteIcon from '../../widgets/icons/delete'
import EditIcon from '../../widgets/icons/edit'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import './sidebarAddBoardMenu.scss'

type Props = {
    showBoard: (id?: string) => void
    workspaceTree: WorkspaceTree,
    activeBoardId?: string
    intl: IntlShape
}

type State = {
    globalTemplateTree?: GlobalTemplateTree,
}

class SidebarAddBoardMenu extends React.Component<Props, State> {
    state: State = {}

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidMount(): void {
        this.syncGlobalTemplates()
    }

    private async syncGlobalTemplates() {
        if (octoClient.workspaceId !== '0' && !this.state.globalTemplateTree) {
            const globalTemplateTree = await MutableGlobalTemplateTree.sync()
            this.setState({globalTemplateTree})
        }
    }

    render(): JSX.Element {
        const {workspaceTree, intl} = this.props
        const {globalTemplateTree} = this.state

        if (!workspaceTree) {
            return <div/>
        }

        return (
            <div className='SidebarAddBoardMenu'>
                <MenuWrapper>
                    <div className='menu-entry'>
                        <FormattedMessage
                            id='Sidebar.add-board'
                            defaultMessage='+ Add Board'
                        />
                    </div>
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

                        {workspaceTree.boardTemplates.map((boardTemplate) => this.renderBoardTemplate(boardTemplate))}

                        {globalTemplateTree && globalTemplateTree.boardTemplates.map((boardTemplate) => this.renderBoardTemplate(boardTemplate, true))}

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
            </div>
        )
    }

    private renderBoardTemplate(boardTemplate: Board, isGlobal = false): JSX.Element {
        const {intl} = this.props

        const displayName = boardTemplate.title || intl.formatMessage({id: 'Sidebar.untitled', defaultMessage: 'Untitled'})

        return (
            <Menu.Text
                key={boardTemplate.id}
                id={boardTemplate.id}
                name={displayName}
                icon={<div className='Icon'>{boardTemplate.icon}</div>}
                onClick={() => {
                    if (isGlobal) {
                        this.addBoardFromGlobalTemplate(boardTemplate.id)
                    } else {
                        this.addBoardFromTemplate(boardTemplate.id)
                    }
                }}
                rightIcon={!isGlobal &&
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

    private async addBoardFromGlobalTemplate(boardTemplateId: string) {
        const oldBoardId = this.props.activeBoardId

        await mutator.duplicateFromRootBoard(
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
}

export default injectIntl(SidebarAddBoardMenu)
