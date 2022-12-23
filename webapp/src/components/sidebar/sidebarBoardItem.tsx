// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useRef, useContext} from 'react'
import {useIntl} from 'react-intl'
import {Draggable} from 'react-beautiful-dnd'

import {Board} from '../../blocks/board'
import {BoardView, IViewType} from '../../blocks/boardView'
import {Page} from '../../blocks/page'

import './sidebarBoardItem.scss'
import {CategoryBoards} from '../../store/sidebar'
import {useAppSelector} from '../../store/hooks'
import {getCurrentBoardViews, getCurrentViewId} from '../../store/views'
import CompassIcon from '../../widgets/icons/compassIcon'
import BoardIcon from '../../widgets/icons/board'
import TableIcon from '../../widgets/icons/table'
import GalleryIcon from '../../widgets/icons/gallery'
import CalendarIcon from '../../widgets/icons/calendar'
import isPagesContext from '../../isPages'
import {getCurrentBoardPages, getCurrentPage, getCurrentFolderPage} from '../../store/pages'

import SidebarPageItem from './sidebarPageItem'

import SidebarBoardMenu from './sidebarBoardMenu'

const iconForViewType = (viewType: IViewType): JSX.Element => {
    switch (viewType) {
    case 'board': return <BoardIcon/>
    case 'table': return <TableIcon/>
    case 'gallery': return <GalleryIcon/>
    case 'calendar': return <CalendarIcon/>
    default: return <div/>
    }
}

type Props = {
    isActive: boolean
    categoryBoards: CategoryBoards
    board: Board
    allCategories: CategoryBoards[]
    onDeleteRequest: (board: Board) => void
    showBoard: (boardId: string) => void
    showView: (viewId: string, boardId: string) => void
    index: number
    draggedItemID?: string
    hideViews?: boolean
    showPage: (pageId: string, boardId: string) => void
}

const SidebarBoardItem = (props: Props) => {
    const intl = useIntl()

    const isPages = useContext(isPagesContext)
    const boardViews = useAppSelector(getCurrentBoardViews)
    const pages = useAppSelector(getCurrentBoardPages)
    const currentViewId = useAppSelector(getCurrentViewId)
    const currentPage = useAppSelector(getCurrentPage)
    const currentFolderPage = useAppSelector(getCurrentFolderPage)

    const board = props.board

    const boardItemRef = useRef<HTMLDivElement>(null)

    const title = board.title || (isPages ? intl.formatMessage({id: 'Sidebar.untitled-page', defaultMessage: '(Untitled Page)'}) : intl.formatMessage({id: 'Sidebar.untitled-board', defaultMessage: '(Untitled Board)'}))

    const isPageSelected = isPages && currentPage?.parentId !== ''
    const isBoardHighlighted = props.isActive && !isPageSelected
    const mainPage = pages.find((p) => p.parentId === '')

    return (
        <Draggable
            draggableId={props.board.id}
            key={props.board.id}
            index={props.index}
        >
            {(provided, snapshot) => (
                <div
                    {...provided.draggableProps}
                    ref={provided.innerRef}
                >
                    <div
                        {...provided.dragHandleProps}
                        className={`SidebarBoardItem subitem ${isBoardHighlighted ? 'active' : ''}`}
                        onClick={() => {
                            if (isPages && mainPage) {
                                props.showPage(mainPage.id, board.id)
                            } else {
                                props.showBoard(board.id)
                            }
                        }
                        }
                        ref={boardItemRef}
                    >
                        <div className='octo-sidebar-icon'>
                            {board.icon || (isPages ? <CompassIcon icon='file-text-outline'/> : <CompassIcon icon='product-boards'/>)}
                        </div>
                        <div
                            className='octo-sidebar-title'
                            title={title}
                        >
                            {title}
                        </div>
                        <div>
                            <SidebarBoardMenu
                                categoryBoards={props.categoryBoards}
                                board={props.board}
                                allCategories={props.allCategories}
                                onDeleteRequest={props.onDeleteRequest}
                                showBoard={props.showBoard}
                                showPage={props.showPage}
                                itemRef={boardItemRef}
                            />
                        </div>
                    </div>
                    {props.isActive && !snapshot.isDragging && !props.hideViews && boardViews.map((view: BoardView) => (
                        <div
                            key={view.id}
                            className={`SidebarBoardItem sidebar-view-item ${view.id === currentViewId ? 'active' : ''}`}
                            onClick={() => props.showView(view.id, board.id)}
                        >
                            {iconForViewType(view.fields.viewType)}
                            <div
                                className='octo-sidebar-title'
                                title={view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                            >
                                {view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                            </div>
                        </div>
                    ))}

                    {props.isActive && pages.filter((p) => p.parentId === currentFolderPage?.id).map((page: Page) => (
                        <SidebarPageItem
                            key={page.id}
                            page={page}
                            pages={pages}
                            currentPageId={currentPage?.id}
                            showPage={props.showPage}
                            showBoard={props.showBoard}
                            depth={0}
                        />
                    ))}
                </div>
            )}
        </Draggable>
    )
}

export default React.memo(SidebarBoardItem)
