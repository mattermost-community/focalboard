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
import AddIcon from '../widgets/icons/add'
import BoardIcon from '../widgets/icons/board'
import DeleteIcon from '../widgets/icons/delete'
import DuplicateIcon from '../widgets/icons/duplicate'
import TableIcon from '../widgets/icons/table'
import GalleryIcon from '../widgets/icons/gallery'
import Menu from '../widgets/menu'

type Props = {
    boardTree: BoardTree
    board: Board,
    showView: (id: string) => void
    intl: IntlShape
    readonly: boolean
}

export class ViewMenu extends React.PureComponent<Props> {
    private handleDuplicateView = async () => {
        const {boardTree, showView} = this.props
        Utils.log('duplicateView')
        const currentViewId = boardTree.activeView.id
        const newView = boardTree.activeView.duplicate()
        newView.title = `${boardTree.activeView.title} copy`
        await mutator.insertBlock(
            newView,
            'duplicate view',
            async () => {
                // This delay is needed because OctoListener has a default 100 ms notification delay before updates
                setTimeout(() => {
                    showView(newView.id)
                }, 120)
            },
            async () => {
                showView(currentViewId)
            },
        )
    }

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
        view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})
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
        view.title = intl.formatMessage({id: 'View.NewTableTitle', defaultMessage: 'Table view'})
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

    private handleAddViewGallery = async () => {
        const {board, boardTree, showView, intl} = this.props

        Utils.log('addview-gallery')
        const view = new MutableBoardView()
        view.title = intl.formatMessage({id: 'View.NewGalleryTitle', defaultMessage: 'Gallery view'})
        view.viewType = 'gallery'
        view.parentId = board.id
        view.rootId = board.rootId
        view.visiblePropertyIds = [Constants.titleColumnId]

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
        const {boardTree, intl} = this.props

        const duplicateViewText = intl.formatMessage({
            id: 'View.DuplicateView',
            defaultMessage: 'Duplicate View',
        })
        const deleteViewText = intl.formatMessage({
            id: 'View.DeleteView',
            defaultMessage: 'Delete View',
        })
        const addViewText = intl.formatMessage({
            id: 'View.AddView',
            defaultMessage: 'Add View',
        })
        const boardText = intl.formatMessage({
            id: 'View.Board',
            defaultMessage: 'Board',
        })
        const tableText = intl.formatMessage({
            id: 'View.Table',
            defaultMessage: 'Table',
        })

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
                {!this.props.readonly &&
                    <Menu.Text
                        id='__duplicateView'
                        name={duplicateViewText}
                        icon={<DuplicateIcon/>}
                        onClick={this.handleDuplicateView}
                    />
                }
                {!this.props.readonly && boardTree.views.length > 1 &&
                    <Menu.Text
                        id='__deleteView'
                        name={deleteViewText}
                        icon={<DeleteIcon/>}
                        onClick={this.handleDeleteView}
                    />
                }
                {!this.props.readonly &&
                    <Menu.SubMenu
                        id='__addView'
                        name={addViewText}
                        icon={<AddIcon/>}
                    >
                        <Menu.Text
                            id='board'
                            name={boardText}
                            icon={<BoardIcon/>}
                            onClick={this.handleAddViewBoard}
                        />
                        <Menu.Text
                            id='table'
                            name={tableText}
                            icon={<TableIcon/>}
                            onClick={this.handleAddViewTable}
                        />
                        <Menu.Text
                            id='gallery'
                            name='Gallery'
                            icon={<GalleryIcon/>}
                            onClick={this.handleAddViewGallery}
                        />
                    </Menu.SubMenu>
                }
            </Menu>
        )
    }

    private iconForViewType(viewType: IViewType) {
        switch (viewType) {
        case 'board': return <BoardIcon/>
        case 'table': return <TableIcon/>
        case 'gallery': return <GalleryIcon/>
        default: return <div/>
        }
    }
}

export default injectIntl(ViewMenu)
