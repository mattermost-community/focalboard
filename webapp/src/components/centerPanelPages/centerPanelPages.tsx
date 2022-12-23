// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useEffect, useState} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'

import {ClientConfig} from '../../config/clientConfig'

import {Page} from '../../blocks/page'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {IUser} from '../../user'
import mutator from '../../mutator'
import {IDType, Utils} from '../../utils'
import {getBoardUsers} from '../../store/users'
import {getCurrentBoardPages} from '../../store/pages'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../telemetry/telemetryClient'
import CompassIcon from '../../widgets/icons/compassIcon'
import IconButton from '../../widgets/buttons/iconButton'
import Button from '../../widgets/buttons/button'
import GuestBadge from '../../widgets/guestBadge'
import MenuWrapper from '../../widgets/menuWrapper'
import Menu from '../../widgets/menu'
import {PropertyTypes} from '../../widgets/propertyMenu'
import {Permission} from '../../constants'
import {useHasCurrentBoardPermissions} from '../../hooks/permissions'

import {useAppSelector} from '../../store/hooks'

import Breadcrumbs from './breadcrumbs'
import PageTitle from './pageTitle'
import PageHeader from './pageHeader'
import PageBlocks from './pageBlocks'
import PageProperties from './pageProperties'

import './centerPanelPages.scss'

const imageURLForUser = (window as any).Components?.imageURLForUser

type Props = {
    clientConfig?: ClientConfig
    board: Board
    activePage: Page
    readonly: boolean
    showPage: (pageId?: string) => void
}

const CenterPanelPages = (props: Props) => {
    const intl = useIntl()
    const folderUsersById = useAppSelector<{[key: string]: IUser}>(getBoardUsers)
    const canEditBoardProperties = useHasCurrentBoardPermissions([Permission.ManageBoardProperties])
    const canEditBoardCards = useHasCurrentBoardPermissions([Permission.ManageBoardCards])
    const currentBoardPages = useAppSelector(getCurrentBoardPages)
    const [newTemplateId, setNewTemplateId] = useState('')
    const [expanded, setExpanded] = useState(false)

    // empty dependency array yields behavior like `componentDidMount`, it only runs _once_
    // https://stackoverflow.com/a/58579462
    useEffect(() => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ViewBoard, {board: props.board.id, page: props.activePage?.id})
    }, [])

    const owner = folderUsersById[props.activePage.createdBy]

    let profileImg
    if (owner?.id) {
        profileImg = `${imageURLForUser ? imageURLForUser(owner.id) : ''}`
    }

    return (
        <div
            className='CenterPanelPages'
        >
            <PageHeader
                showPage={props.showPage}
                readonly={props.readonly}
                activePage={props.activePage}
                enablePublicSharedBoards={props.clientConfig?.enablePublicSharedBoards || false}
                boardId={props.board.id}
            />

            <div className={expanded ? 'content expanded' : 'content'}>
                <div className='doc-header'>
                    <Breadcrumbs
                        board={props.board}
                        activePage={props.activePage}
                        pages={currentBoardPages}
                        showPage={props.showPage}
                    />
                    <div className='expand-collapsed-button'>
                        <IconButton
                            size='small'
                            onClick={() => setExpanded(!expanded)}
                            icon={<CompassIcon icon={expanded ? 'arrow-collapse' : 'arrow-expand'}/>}
                        />
                    </div>
                </div>

                <PageTitle
                    page={props.activePage}
                    board={props.board}
                    readonly={props.readonly}
                />

                <div className='page-author'>
                    <div className='person'>
                        {profileImg && (
                            <img
                                alt='Person-avatar'
                                src={profileImg}
                            />
                        )}
                        <FormattedMessage
                            id='Page.author'
                            defaultMessage='Created by {author} {badge}'
                            values={{
                                author: <b>{owner && Utils.getUserDisplayName(owner, props.clientConfig?.teammateNameDisplay || '')}</b>,
                                badge: <GuestBadge show={Boolean(owner?.is_guest)}/>,
                            }}
                        />
                        {' - '}
                        <FormattedMessage
                            id='Page.author'
                            defaultMessage='Last updated: {date}'
                            values={{date: Utils.relativeDisplayDateTime(new Date(props.activePage.updateAt), intl)}}
                        />
                    </div>
                    <div className='add-property'>
                        {!props.readonly && canEditBoardProperties &&
                            <MenuWrapper>
                                <Button
                                    emphasis='quaternary'
                                    size='medium'
                                >
                                    <FormattedMessage
                                        id='CardDetail.add-property'
                                        defaultMessage='+ Add a property'
                                    />
                                </Button>
                                <Menu>
                                    <PropertyTypes
                                        label={intl.formatMessage({id: 'PropertyMenu.selectType', defaultMessage: 'Select property type'})}
                                        onTypeSelected={async (type) => {
                                            const template: IPropertyTemplate = {
                                                id: Utils.createGuid(IDType.BlockID),
                                                name: type.displayName(intl),
                                                type: type.type,
                                                options: [],
                                            }
                                            const templateId = await mutator.insertPropertyTemplate(props.board, {fields: {}} as any, -1, template)
                                            setNewTemplateId(templateId)
                                        }}
                                    />
                                </Menu>
                            </MenuWrapper>}
                    </div>
                </div>

                <PageProperties
                    board={props.board}
                    readonly={props.readonly}
                    canEditBoardProperties={canEditBoardProperties}
                    canEditBoardCards={canEditBoardCards}
                    newTemplateId={newTemplateId}
                    page={props.activePage}
                />

                <PageBlocks
                    readonly={props.readonly}
                    activePage={props.activePage}
                    canEditBoardCards={canEditBoardCards}
                    board={props.board}
                />
            </div>
        </div>
    )
}

export default React.memo(CenterPanelPages)
