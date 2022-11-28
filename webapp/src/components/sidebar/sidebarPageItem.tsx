// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl} from 'react-intl'

import {Board} from '../../blocks/board'
import {Page, createPage} from '../../blocks/page'
import {Block} from '../../blocks/block'
import mutator from '../../mutator'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../telemetry/telemetryClient'

import CompassIcon from '../../widgets/icons/compassIcon'

import PageMenu from '../pageMenu'
import {Utils} from '../../utils'

type Props = {
    page: Page
    pages: Page[]
    board: Board
    currentPageId: string
    showPage: (pageId: string, boardId: string) => void
    showBoard: (boardId: string) => void
    depth: number
}

const SidebarPageItem = (props: Props) => {
    const intl = useIntl()
    const {page, pages, board, currentPageId, depth} = props
    const subpages = pages.filter((p) => p.parentId == page.id)

    return (
        <>
            <div
                key={page.id}
                className={`SidebarBoardItem sidebar-page-item ${page.id === currentPageId ? 'active' : ''} depth-${depth}`}
                onClick={() => props.showPage(page.id, board.id)}
            >
                {page.fields.icon || <CompassIcon icon='file-text-outline'/>}
                <div
                    className='octo-sidebar-title'
                    title={page.title || intl.formatMessage({id: 'Sidebar.untitled-page', defaultMessage: '(Untitled Page)'})}
                >
                    {page.title || intl.formatMessage({id: 'Sidebar.untitled-page', defaultMessage: '(Untitled Page)'})}
                </div>
                <PageMenu
                    pageId={page.id}
                    onClickDelete={async () => {
                        if (!page) {
                            Utils.assertFailure()
                            return
                        }
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeletePage, {board: props.board.id, page: page.id})
                        await mutator.deleteBlock(page, 'delete page')
                        props.showBoard(page.boardId)
                    }}
                    onClickDuplicate={async () => {
                        if (!page) {
                            Utils.assertFailure()
                            return
                        }
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicatePage, {board: props.board.id, page: page.id})
                        await mutator.duplicatePage(
                            page.id,
                            props.board.id,
                            'duplicate page',
                            async (newPageId: string) => {
                                props.showPage(newPageId, page.boardId)
                            },
                            async () => {
                                props.showPage(page.id, page.boardId)
                            },
                        )
                    }}
                    onClickAddSubpage={async () => {
                        if (!page) {
                            Utils.assertFailure()
                            return
                        }
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateSubpage, {board: props.board.id, page: page.id})
                        const subpage = createPage()
                        subpage.parentId = page.id
                        subpage.boardId = board.id
                        await mutator.insertBlock(
                            board.id,
                            subpage,
                            intl.formatMessage({id: 'Mutator.new-subpage', defaultMessage: 'new subpage'}),
                            async (newBlock: Block) => {
                                props.showPage(newBlock.id, board.id)
                            },
                            async () => {
                                props.showPage(currentPageId, board.id)
                            },
                        )
                    }}
                />
            </div>
            {subpages.map((page: Page) => (
                <SidebarPageItem
                    depth={props.depth+1}
                    page={page}
                    pages={pages}
                    board={board}
                    currentPageId={currentPageId}
                    showPage={props.showPage}
                    showBoard={props.showBoard}
                />
            ))}
        </>
    )
}

export default React.memo(SidebarPageItem)
