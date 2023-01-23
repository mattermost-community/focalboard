// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {useIntl} from 'react-intl'

import {Page, createPage} from '../../blocks/page'
import {Block} from '../../blocks/block'
import mutator from '../../mutator'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../telemetry/telemetryClient'

import CompassIcon from '../../widgets/icons/compassIcon'

import PageMenu from '../pageMenu'

import './sidebarPageItem.scss'

type Props = {
    page: Page
    pages: Page[]
    currentPageId: string
    showPage: (pageId: string, boardId: string) => void
    showBoard: (boardId: string) => void
    depth: number
}

const SidebarPageItem = (props: Props) => {
    const intl = useIntl()
    const {page, pages, currentPageId, depth} = props
    const subpages = pages.filter((p) => p.parentId === page.id)

    const onItemClick = useCallback(() => props.showPage(page.id, page.boardId), [page.id, page.boardId, props.showPage])

    const onDeleteClick = useCallback(async () => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeletePage, {board: page.boardId, page: page.id})
        await mutator.deleteBlock(page, 'delete page')
        props.showBoard(page.boardId)
    }, [page.boardId, page.id, props.showBoard])

    const onDuplicateClick = useCallback(async () => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicatePage, {board: page.boardId, page: page.id})
        await mutator.duplicatePage(
            page.id,
            page.boardId,
            'duplicate page',
            async (newPageId: string) => {
                props.showPage(newPageId, page.boardId)
            },
            async () => {
                props.showPage(page.id, page.boardId)
            },
        )
    }, [page.id, page.boardId, props.showPage])

    const onAddSubpageClick = useCallback(async () => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateSubpage, {board: page.boardId, page: page.id})
        const subpage = createPage()
        subpage.parentId = page.id
        subpage.boardId = page.boardId
        await mutator.insertBlock(
            page.boardId,
            subpage,
            intl.formatMessage({id: 'Mutator.new-subpage', defaultMessage: 'new subpage'}),
            async (newBlock: Block) => {
                props.showPage(newBlock.id, page.boardId)
            },
            async () => {
                props.showPage(currentPageId, page.boardId)
            },
        )
    }, [page.id, page.boardId, props.showPage, currentPageId])

    return (
        <>
            <div
                className={`SidebarPageItem ${page.id === currentPageId ? 'active' : ''} depth-${depth}`}
                onClick={onItemClick}
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
                    onClickDelete={onDeleteClick}
                    onClickDuplicate={onDuplicateClick}
                    onClickAddSubpage={onAddSubpageClick}
                />
            </div>
            {subpages.map((subpage: Page) => (
                <SidebarPageItem
                    key={subpage.id}
                    depth={props.depth + 1}
                    page={subpage}
                    pages={pages}
                    currentPageId={currentPageId}
                    showPage={props.showPage}
                    showBoard={props.showBoard}
                />
            ))}
        </>
    )
}

export default React.memo(SidebarPageItem)
