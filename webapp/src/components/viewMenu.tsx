// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {injectIntl, IntlShape} from 'react-intl'

import {Board} from '../blocks/board'
import {MutableBoardView} from '../blocks/boardView'
import {BoardTree} from '../viewModel/boardTree'
import mutator from '../mutator'
import {Utils} from '../utils'
import Menu from '../widgets/menu'
import {Constants} from '../constants'

type Props = {
    boardTree: BoardTree
    board: Board,
    showView: (id: string) => void
    intl: IntlShape
}

export class ViewMenu extends React.Component<Props> {
    handleDeleteView = async () => {
        const {boardTree, showView} = this.props
        Utils.log('deleteView')
        const view = boardTree.activeView
        const nextView = boardTree.views.find((o) => o !== view)
        await mutator.deleteBlock(view, 'delete view')
        showView(nextView.id)
    }

    handleViewClick = (id: string) => {
        const {boardTree, showView} = this.props
        Utils.log('view ' + id)
        const view = boardTree.views.find((o) => o.id === id)
        showView(view.id)
    }

    handleAddViewBoard = async () => {
        const {board, boardTree, showView, intl} = this.props
        Utils.log('addview-board')
        const view = new MutableBoardView()
        view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board View'})
        view.viewType = 'board'
        view.parentId = board.id

        const oldViewId = boardTree.activeView.id

        await mutator.insertBlock(
            view,
            'add view',
            async () => {
                showView(view.id)
            },
            async () => {
                showView(oldViewId)
            })
    }

    handleAddViewTable = async () => {
        const {board, boardTree, showView, intl} = this.props

        Utils.log('addview-table')
        const view = new MutableBoardView()
        view.title = intl.formatMessage({id: 'View.NewTableTitle', defaultMessage: 'Table View'})
        view.viewType = 'table'
        view.parentId = board.id
        view.visiblePropertyIds = board.cardProperties.map((o) => o.id)
        view.columnWidths = {}
        view.columnWidths[Constants.titleColumnId] = Constants.defaultTitleColumnWidth

        const oldViewId = boardTree.activeView.id

        await mutator.insertBlock(
            view,
            'add view',
            async () => {
                showView(view.id)
            },
            async () => {
                showView(oldViewId)
            })
    }

    render() {
        const {boardTree} = this.props
        return (
            <Menu>
                {boardTree.views.map((view) => (
                    <Menu.Text
                        key={view.id}
                        id={view.id}
                        name={view.title}
                        onClick={this.handleViewClick}
                    />))}
                <Menu.Separator/>
                {boardTree.views.length > 1 && <Menu.Text
                    id='__deleteView'
                    name='Delete View'
                    onClick={this.handleDeleteView}
                />}
                <Menu.SubMenu
                    id='__addView'
                    name='Add View'
                >
                    <Menu.Text
                        id='board'
                        name='Board'
                        onClick={this.handleAddViewBoard}
                    />
                    <Menu.Text
                        id='table'
                        name='Table'
                        onClick={this.handleAddViewTable}
                    />
                </Menu.SubMenu>
            </Menu>
        )
    }
}

export default injectIntl(ViewMenu)
