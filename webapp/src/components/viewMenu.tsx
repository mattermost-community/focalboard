// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {injectIntl, IntlShape} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board} from '../blocks/board'
import {BoardView, IViewType, MutableBoardView} from '../blocks/boardView'
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
    intl: IntlShape
    readonly: boolean
}

const ViewMenu = React.memo((props: Props) => {
    const history = useHistory()
    const match = useRouteMatch()

    const showView = useCallback((viewId) => {
        const newPath = generatePath(match.path, {...match.params, viewId: viewId || ''})
        history.push(newPath)
    }, [match, history])

    const handleDuplicateView = useCallback(() => {
        const {boardTree} = props
        Utils.log('duplicateView')
        const currentViewId = boardTree.activeView.id
        const newView = boardTree.activeView.duplicate()
        newView.title = `${boardTree.activeView.title} copy`
        mutator.insertBlock(
            newView,
            'duplicate view',
            async () => {
                // This delay is needed because WSClient has a default 100 ms notification delay before updates
                setTimeout(() => {
                    showView(newView.id)
                }, 120)
            },
            async () => {
                showView(currentViewId)
            },
        )
    }, [props.boardTree, showView])

    const handleDeleteView = useCallback(() => {
        const {boardTree} = props
        Utils.log('deleteView')
        const view = boardTree.activeView
        const nextView = boardTree.views.find((o) => o !== view)
        mutator.deleteBlock(view, 'delete view')
        if (nextView) {
            showView(nextView.id)
        }
    }, [props.boardTree, showView])

    const handleViewClick = useCallback((id: string) => {
        const {boardTree} = props
        Utils.log('view ' + id)
        const view = boardTree.views.find((o) => o.id === id)
        Utils.assert(view, `view not found: ${id}`)
        if (view) {
            showView(view.id)
        }
    }, [props.boardTree, showView])

    const handleAddViewBoard = useCallback(() => {
        const {board, boardTree, intl} = props
        Utils.log('addview-board')
        const view = new MutableBoardView()
        view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})
        view.viewType = 'board'
        view.parentId = board.id
        view.rootId = board.rootId

        const oldViewId = boardTree.activeView.id

        mutator.insertBlock(
            view,
            'add view',
            async () => {
                // This delay is needed because WSClient has a default 100 ms notification delay before updates
                setTimeout(() => {
                    showView(view.id)
                }, 120)
            },
            async () => {
                showView(oldViewId)
            })
    }, [props.boardTree, props.board, props.intl, showView])

    const handleAddViewTable = useCallback(() => {
        const {board, boardTree, intl} = props

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

        mutator.insertBlock(
            view,
            'add view',
            async () => {
                // This delay is needed because WSClient has a default 100 ms notification delay before updates
                setTimeout(() => {
                    Utils.log(`showView: ${view.id}`)
                    showView(view.id)
                }, 120)
            },
            async () => {
                showView(oldViewId)
            })
    }, [props.boardTree, props.board, props.intl, showView])

    const handleAddViewGallery = useCallback(() => {
        const {board, boardTree, intl} = props

        Utils.log('addview-gallery')
        const view = new MutableBoardView()
        view.title = intl.formatMessage({id: 'View.NewGalleryTitle', defaultMessage: 'Gallery view'})
        view.viewType = 'gallery'
        view.parentId = board.id
        view.rootId = board.rootId
        view.visiblePropertyIds = [Constants.titleColumnId]

        const oldViewId = boardTree.activeView.id

        mutator.insertBlock(
            view,
            'add view',
            async () => {
                // This delay is needed because WSClient has a default 100 ms notification delay before updates
                setTimeout(() => {
                    Utils.log(`showView: ${view.id}`)
                    showView(view.id)
                }, 120)
            },
            async () => {
                showView(oldViewId)
            })
    }, [props.board, props.boardTree, props.intl, showView])

    const {boardTree, intl} = props

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

    const iconForViewType = (viewType: IViewType) => {
        switch (viewType) {
        case 'board': return <BoardIcon/>
        case 'table': return <TableIcon/>
        case 'gallery': return <GalleryIcon/>
        default: return <div/>
        }
    }

    return (
        <Menu>
            {boardTree.views.map((view: BoardView) => (
                <Menu.Text
                    key={view.id}
                    id={view.id}
                    name={view.title}
                    icon={iconForViewType(view.viewType)}
                    onClick={handleViewClick}
                />))}
            <Menu.Separator/>
            {!props.readonly &&
                <Menu.Text
                    id='__duplicateView'
                    name={duplicateViewText}
                    icon={<DuplicateIcon/>}
                    onClick={handleDuplicateView}
                />
            }
            {!props.readonly && boardTree.views.length > 1 &&
                <Menu.Text
                    id='__deleteView'
                    name={deleteViewText}
                    icon={<DeleteIcon/>}
                    onClick={handleDeleteView}
                />
            }
            {!props.readonly &&
                <Menu.SubMenu
                    id='__addView'
                    name={addViewText}
                    icon={<AddIcon/>}
                >
                    <Menu.Text
                        id='board'
                        name={boardText}
                        icon={<BoardIcon/>}
                        onClick={handleAddViewBoard}
                    />
                    <Menu.Text
                        id='table'
                        name={tableText}
                        icon={<TableIcon/>}
                        onClick={handleAddViewTable}
                    />
                    <Menu.Text
                        id='gallery'
                        name='Gallery'
                        icon={<GalleryIcon/>}
                        onClick={handleAddViewGallery}
                    />
                </Menu.SubMenu>
            }
        </Menu>
    )
})

export default injectIntl(ViewMenu)
