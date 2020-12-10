// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {Board} from '../blocks/board'
import {IViewType, MutableBoardView} from '../blocks/boardView'
import {Constants} from '../constants'
import mutator from '../mutator'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import BoardIcon from '../widgets/icons/board'
import TableIcon from '../widgets/icons/table'
import Menu from '../widgets/menu'

type Props = {
    boardTree: BoardTree
    board: Board,
    showView: (id: string) => void
    intl: IntlShape
}

export class ViewMenu extends React.PureComponent<Props> {
    private handleDeleteView = async () => {
        const {boardTree, showView} = this.props
        Utils.log('deleteView')
        const view = boardTree.activeView
        const nextView = boardTree.views.find((o) => o !== view)
        await mutator.deleteBlock(view, 'delete view')
        if (nextView) {
            showView(nextView.id)
        }
    }

    private handleViewClick = (id: string) => {
        const {boardTree, showView} = this.props
        Utils.log('view ' + id)
        const view = boardTree.views.find((o) => o.id === id)
        Utils.assert(view, `view not found: ${id}`)
        if (view) {
            showView(view.id)
        }
    }

    private handleAddViewBoard = async () => {
        const {board, boardTree, showView, intl} = this.props
        Utils.log('addview-board')
        const view = new MutableBoardView()
        view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board View'})
        view.viewType = 'board'
        view.parentId = board.id
        view.rootId = board.rootId

        const oldViewId = boardTree.activeView.id

        await mutator.insertBlock(
            view,
            'add view',
            async () => {
                // This delay is needed because OctoListener has a default 100 ms notification delay before updates
                setTimeout(() => {
                    showView(view.id)
                }, 120)
            },
            async () => {
                showView(oldViewId)
            })
    }

    private handleAddViewTable = async () => {
        const {board, boardTree, showView, intl} = this.props

        Utils.log('addview-table')
        const view = new MutableBoardView()
        view.title = intl.formatMessage({id: 'View.NewTableTitle', defaultMessage: 'Table View'})
        view.viewType = 'table'
        view.parentId = board.id
        view.rootId = board.rootId
        view.visiblePropertyIds = board.cardProperties.map((o) => o.id)
        view.columnWidths = {}
        view.columnWidths[Constants.titleColumnId] = Constants.defaultTitleColumnWidth

        const oldViewId = boardTree.activeView.id

        await mutator.insertBlock(
            view,
            'add view',
            async () => {
                // This delay is needed because OctoListener has a default 100 ms notification delay before updates
                setTimeout(() => {
                    Utils.log(`showView: ${view.id}`)
                    showView(view.id)
                }, 120)
            },
            async () => {
                showView(oldViewId)
            })
    }

    render(): JSX.Element {
        const {boardTree} = this.props
        return (
            <Menu>
                {boardTree.views.map((view) => (
                    <Menu.Text
                        key={view.id}
                        id={view.id}
                        name={view.title}
                        icon={this.iconForViewType(view.viewType)}
                        onClick={this.handleViewClick}
                    />))}
                <Menu.Separator/>
                {boardTree.views.length > 1 &&
                    <Menu.Text
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

    private iconForViewType(viewType: IViewType) {
        switch (viewType) {
        case 'board': return <BoardIcon/>
        case 'table': return <TableIcon/>
        default: return <div/>
        }
    }
}

export default injectIntl(ViewMenu)
