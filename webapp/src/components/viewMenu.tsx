// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {injectIntl, IntlShape} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board, IPropertyTemplate} from '../blocks/board'
import {BoardView, createBoardView, IViewType} from '../blocks/boardView'
import {Constants} from '../constants'
import mutator from '../mutator'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import {IDType, Utils} from '../utils'
import AddIcon from '../widgets/icons/add'
import BoardIcon from '../widgets/icons/board'
import DeleteIcon from '../widgets/icons/delete'
import DuplicateIcon from '../widgets/icons/duplicate'
import GalleryIcon from '../widgets/icons/gallery'
import TableIcon from '../widgets/icons/table'
import Menu from '../widgets/menu'

type Props = {
    board: Board,
    activeView: BoardView,
    views: BoardView[],
    intl: IntlShape
    readonly: boolean
}

const ViewMenu = React.memo((props: Props) => {
    const history = useHistory()
    const match = useRouteMatch()

    const showView = useCallback((viewId) => {
        let newPath = generatePath(match.path, {...match.params, viewId: viewId || ''})
        if (props.readonly) {
            newPath += `?r=${Utils.getReadToken()}`
        }
        history.push(newPath)
    }, [match, history])

    const handleDuplicateView = useCallback(() => {
        const {activeView} = props
        Utils.log('duplicateView')
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicateBoardView, {board: props.board.id, view: activeView.id})
        const currentViewId = activeView.id
        const newView = createBoardView(activeView)
        newView.title = `${activeView.title} copy`
        newView.id = Utils.createGuid(IDType.View)
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
    }, [props.activeView, showView])

    const handleDeleteView = useCallback(() => {
        const {activeView, views} = props
        Utils.log('deleteView')
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteBoardView, {board: props.board.id, view: activeView.id})
        const view = activeView
        const nextView = views.find((o) => o !== view)
        mutator.deleteBlock(view, 'delete view')
        if (nextView) {
            showView(nextView.id)
        }
    }, [props.views, props.activeView, showView])

    const handleViewClick = useCallback((id: string) => {
        const {views} = props
        Utils.log('view ' + id)
        const view = views.find((o) => o.id === id)
        Utils.assert(view, `view not found: ${id}`)
        if (view) {
            showView(view.id)
        }
    }, [props.views, showView])

    const handleAddViewBoard = useCallback(() => {
        const {board, activeView, intl} = props
        Utils.log('addview-board')
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoardView, {board: props.board.id, view: activeView.id})
        const view = createBoardView()
        view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})
        view.fields.viewType = 'board'
        view.parentId = board.id
        view.rootId = board.rootId

        const oldViewId = activeView.id

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
    }, [props.activeView, props.board, props.intl, showView])

    const handleAddViewTable = useCallback(() => {
        const {board, activeView, intl} = props

        Utils.log('addview-table')
        const view = createBoardView()
        view.title = intl.formatMessage({id: 'View.NewTableTitle', defaultMessage: 'Table view'})
        view.fields.viewType = 'table'
        view.parentId = board.id
        view.rootId = board.rootId
        view.fields.visiblePropertyIds = board.fields.cardProperties.map((o: IPropertyTemplate) => o.id)
        view.fields.columnWidths = {}
        view.fields.columnWidths[Constants.titleColumnId] = Constants.defaultTitleColumnWidth

        const oldViewId = activeView.id

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
    }, [props.activeView, props.board, props.intl, showView])

    const handleAddViewGallery = useCallback(() => {
        const {board, activeView, intl} = props

        Utils.log('addview-gallery')
        const view = createBoardView()
        view.title = intl.formatMessage({id: 'View.NewGalleryTitle', defaultMessage: 'Gallery view'})
        view.fields.viewType = 'gallery'
        view.parentId = board.id
        view.rootId = board.rootId
        view.fields.visiblePropertyIds = [Constants.titleColumnId]

        const oldViewId = activeView.id

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
    }, [props.board, props.activeView, props.intl, showView])

    const {views, intl} = props

    const duplicateViewText = intl.formatMessage({
        id: 'View.DuplicateView',
        defaultMessage: 'Duplicate view',
    })
    const deleteViewText = intl.formatMessage({
        id: 'View.DeleteView',
        defaultMessage: 'Delete view',
    })
    const addViewText = intl.formatMessage({
        id: 'View.AddView',
        defaultMessage: 'Add view',
    })
    const boardText = intl.formatMessage({
        id: 'View.Board',
        defaultMessage: 'Board',
    })
    const tableText = intl.formatMessage({
        id: 'View.Table',
        defaultMessage: 'Table',
    })
    const galleryText = intl.formatMessage({
        id: 'View.Gallery',
        defaultMessage: 'Gallery',
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
            {views.map((view: BoardView) => (
                <Menu.Text
                    key={view.id}
                    id={view.id}
                    name={view.title}
                    icon={iconForViewType(view.fields.viewType)}
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
            {!props.readonly && views.length > 1 &&
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
                        name={galleryText}
                        icon={<GalleryIcon/>}
                        onClick={handleAddViewGallery}
                    />
                </Menu.SubMenu>
            }
        </Menu>
    )
})

export default injectIntl(ViewMenu)
