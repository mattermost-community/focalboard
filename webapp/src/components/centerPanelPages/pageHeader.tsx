// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {useIntl} from 'react-intl'

import {getMe} from '../../store/users'
import {useAppSelector} from '../../store/hooks'
import {Page, createPage} from '../../blocks/page'
import {Block} from '../../blocks/block'

import ShareBoardButton from '../shareBoard/shareBoardButton'
import ShareBoardLoginButton from '../shareBoard/shareBoardLoginButton'
import PageMenu from '../pageMenu'

import mutator from '../../mutator'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import CompassIcon from '../../widgets/icons/compassIcon'
import IconButton from '../../widgets/buttons/iconButton'
import Button from '../../widgets/buttons/button'

import FormattingMenu from './formattingMenu'

import './pageHeader.scss'

type Props = {
    readonly: boolean
    showPage: (pageId?: string) => void
    activePage: Page
    boardId: string
    enablePublicSharedBoards: boolean
}

const PageHeader = (props: Props) => {
    const me = useAppSelector(getMe)
    const showShareButton = !props.readonly && me?.id !== 'single-user'
    const showShareLoginButton = props.readonly && me?.id !== 'single-user'
    const intl = useIntl()

    const onDelete = useCallback(() => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeletePage, {board: props.boardId, page: props.activePage.id})
        mutator.deleteBlock(props.activePage, 'delete page').then(() => {
            props.showPage(undefined)
        })
    }, [props.showPage, props.activePage, props.boardId])

    const onDuplicate = useCallback(() => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicatePage, {board: props.boardId, page: props.activePage.id})
        mutator.duplicatePage(
            props.activePage.id,
            props.boardId,
            'duplicate page',
            async (newPageId: string) => {
                props.showPage(newPageId)
            },
            async () => {
                props.showPage(props.activePage.id)
            },
        )
    }, [props.showPage, props.boardId, props.activePage.id])

    const onAddSubpage = useCallback(() => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateSubpage, {board: props.boardId, page: props.activePage.id})
        const subpage = createPage()
        subpage.parentId = props.activePage.id || props.boardId
        subpage.boardId = props.boardId
        subpage.title = intl.formatMessage({id: 'View.NewPageTitle', defaultMessage: 'New Sub Page'})
        mutator.insertBlock(
            props.boardId,
            subpage,
            intl.formatMessage({id: 'Mutator.new-subpage', defaultMessage: 'new subpage'}),
            async (newBlock: Block) => {
                props.showPage(newBlock.id)
            },
            async () => {
                props.showPage(props.activePage.id)
            },
        )
    }, [])

    return (
        <div className='PageHeader'>
            <div className='mid-head'>
                <FormattingMenu/>
                <div className='shareButtonWrapper'>
                    {showShareButton &&
                        <ShareBoardButton
                            enableSharedBoards={props.enablePublicSharedBoards}
                        />}
                    {showShareLoginButton &&
                        <ShareBoardLoginButton/>}
                </div>
                <Button
                    onClick={() => 'TODO'}
                    size='small'
                    icon={<CompassIcon icon='message-text-outline'/>}
                >
                    {'8'}
                </Button>
                <IconButton
                    size='small'
                    onClick={() => 'TODO'}
                    icon={<CompassIcon icon='star-outline'/>}
                />
                <IconButton
                    size='small'
                    onClick={() => 'TODO'}
                    icon={<CompassIcon icon='information-outline'/>}
                />
                <PageMenu
                    pageId={props.activePage.id}
                    onClickDelete={onDelete}
                    onClickDuplicate={onDuplicate}
                    onClickAddSubpage={onAddSubpage}
                />
            </div>
        </div>
    )
}

export default React.memo(PageHeader)
