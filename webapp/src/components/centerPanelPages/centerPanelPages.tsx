// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useEffect, useMemo, useState} from 'react'
import {useIntl, IntlShape, FormattedMessage} from 'react-intl'

import {ClientConfig} from '../../config/clientConfig'

import {Block, ContentBlockTypes, createBlock} from '../../blocks/block'
import {Page, createPage} from '../../blocks/page'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {IUser} from '../../user'
import mutator from '../../mutator'
import {IDType, Utils} from '../../utils'
import {getCurrentPageContents} from '../../store/contents'
import {getBoardUsers} from '../../store/users'
import {updateContents} from '../../store/contents'
import {getMySortedPageFolders} from '../../store/boards'
import {getCurrentBoardPages} from '../../store/pages'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../telemetry/telemetryClient'
import CompassIcon from '../../widgets/icons/compassIcon'
import IconButton from '../../widgets/buttons/iconButton'
import Button from '../../widgets/buttons/button'
import GuestBadge from '../../widgets/guestBadge'
import MenuWrapper from '../../widgets/menuWrapper'
import Menu from '../../widgets/menu'
import PropertyMenu, {PropertyTypes} from '../../widgets/propertyMenu'
import {Permission} from '../../constants'
import {useHasCurrentBoardPermissions} from '../../hooks/permissions'

import PropertyValueElement from '../propertyValueElement'
import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../confirmationDialogBox'

import propRegistry from '../../properties'
import {PropertyType} from '../../properties/types'

import {sendFlashMessage} from '../flashMessages'

import PageTitle from '../pageTitle'
import PageMenu from '../pageMenu'

import {useAppSelector, useAppDispatch} from '../../store/hooks'
import {updatePages} from '../../store/pages'

import {getMe} from '../../store/users'

import octoClient from '../../octoClient'

import ShareBoardButton from '../shareBoard/shareBoardButton'
import ShareBoardLoginButton from '../shareBoard/shareBoardLoginButton'

import BlocksEditor from '../blocksEditor/blocksEditor'
import {BlockData} from '../blocksEditor/blocks/types'

import ShareBoardTourStep from '../onboardingTour/shareBoard/shareBoard'

import FormattingMenu from './formattingMenu'
import Breadcrumbs from './breadcrumbs'

import './centerPanelPages.scss'

const imageURLForUser = (window as any).Components?.imageURLForUser

type Props = {
    clientConfig?: ClientConfig
    board: Board
    activePage: Page
    readonly: boolean
    showPage: (pageId?: string) => void
}

async function addBlockNewEditor(page: any, intl: IntlShape, title: string, fields: any, contentType: ContentBlockTypes, afterBlockId: string, dispatch: any): Promise<Block> {
    const block = createBlock()
    block.parentId = page.id
    block.boardId = page.boardId || page.id
    block.title = title
    block.type = contentType
    block.fields = {...block.fields, ...fields}

    const description = intl.formatMessage({id: 'CardDetail.addCardText', defaultMessage: 'add page text'})

    const afterRedo = async (newBlock: Block) => {
        let contentOrder = page.fields?.contentOrder.slice()
        if (!page.boardId) {
            contentOrder = page.properties?.contentOrder?.slice() || []
        }
        if (afterBlockId) {
            const idx = contentOrder.indexOf(afterBlockId)
            if (idx === -1) {
                contentOrder.push(newBlock.id)
            } else {
                contentOrder.splice(idx + 1, 0, newBlock.id)
            }
        } else {
            contentOrder.push(newBlock.id)
        }
        if (page.boardId) {
            await octoClient.patchBlock(page.boardId, page.id, {updatedFields: {contentOrder}})
        } else {
            await octoClient.patchBoard(page.id, {updatedProperties: {contentOrder}})
        }
        dispatch(updatePages([{...page, fields: {...page.fields, contentOrder}}]))
    }

    const beforeUndo = async () => {
        const contentOrder = page.fields.contentOrder.slice()
        if (page.boardId) {
            await octoClient.patchBlock(page.boardId, page.id, {updatedFields: {contentOrder}})
        } else {
            await octoClient.patchBoard(page.id, {updatedProperties: {contentOrder}})
        }
    }

    const newBlock = await mutator.insertBlock(block.boardId, block, description, afterRedo, beforeUndo)
    dispatch(updateContents([newBlock]))
    return newBlock
}

const CenterPanelPages = (props: Props) => {
    const intl = useIntl()
    const me = useAppSelector(getMe)
    const currentPageContents = useAppSelector(getCurrentPageContents)
    const folderUsersById = useAppSelector<{[key: string]: IUser}>(getBoardUsers)
    const canEditBoardProperties = useHasCurrentBoardPermissions([Permission.ManageBoardProperties])
    const canEditBoardCards = useHasCurrentBoardPermissions([Permission.ManageBoardCards])
    const pages = useAppSelector(getMySortedPageFolders)
    const currentBoardPages = useAppSelector(getCurrentBoardPages)
    const [newTemplateId, setNewTemplateId] = useState('')
    const dispatch = useAppDispatch()
    const [expanded, setExpanded] = useState(false)
    const [confirmationDialogBox, setConfirmationDialogBox] = useState<ConfirmationDialogBoxProps>({heading: '', onConfirm: () => {}, onClose: () => {}})
    const [showConfirmationDialog, setShowConfirmationDialog] = useState<boolean>(false)

    // empty dependency array yields behavior like `componentDidMount`, it only runs _once_
    // https://stackoverflow.com/a/58579462
    useEffect(() => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ViewBoard, {board: props.board.id, page: props.activePage?.id})
    }, [])

    const showShareButton = !props.readonly && me?.id !== 'single-user'
    const showShareLoginButton = props.readonly && me?.id !== 'single-user'

    const pageBlocks = useMemo(() => {
        return currentPageContents.flatMap((value: Block | Block[]): BlockData<any> => {
            const v: Block = Array.isArray(value) ? value[0] : value

            let data: any = v?.title
            if (v?.type === 'image') {
                data = {
                    file: v?.fields.fileId,
                }
            }

            if (v?.type === 'attachment') {
                data = {
                    file: v?.fields.fileId,
                    filename: v?.fields.filename,
                }
            }

            if (v?.type === 'video') {
                data = {
                    file: v?.fields.fileId,
                    filename: v?.fields.filename,
                }
            }

            if (v?.type === 'checkbox') {
                data = {
                    value: v?.title,
                    checked: v?.fields.value,
                }
            }

            return {
                id: v?.id,
                value: data,
                contentType: v?.type,
            }
        })
    }, [currentPageContents])

    const activePage = props.activePage || props.board

    const owner = folderUsersById[activePage.createdBy]

    let profileImg
    if (owner?.id) {
        profileImg = imageURLForUser(owner.id)
    }

    let pseudoCard: any
    if (props.activePage) {
        pseudoCard = {
            ...props.activePage,
            fields: {...props.activePage.fields, properties: props.activePage.fields.properties || {}} as any,
        }
    } else {
        pseudoCard = {
            ...props.board,
            fields: {...props.board.properties, properties: props.board.properties.properties || {}} as any,
        }
    }

    function onPropertyChangeSetAndOpenConfirmationDialog(newType: PropertyType, newName: string, propertyTemplate: IPropertyTemplate) {
        const oldType = propRegistry.get(propertyTemplate.type)

        // do nothing if no change
        if (oldType === newType && propertyTemplate.name === newName) {
            return
        }

        if (oldType === newType) {
            mutator.changePropertyTypeAndName(props.board, pages as any, propertyTemplate, newType.type, newName)
            return
        }

        const subTextString = intl.formatMessage({
            id: 'CardDetailProperty.property-name-change-subtext',
            defaultMessage: 'type from "{oldPropType}" to "{newPropType}"',
        }, {oldPropType: oldType.displayName(intl), newPropType: newType.displayName(intl)})

        setConfirmationDialogBox({
            heading: intl.formatMessage({id: 'CardDetailProperty.confirm-property-type-change', defaultMessage: 'Confirm property type change'}),
            subText: intl.formatMessage({
                id: 'CardDetailProperty.confirm-property-name-change-subtext',
                defaultMessage: 'Are you sure you want to change property "{propertyName}" {customText}?',
            },
            {
                propertyName: propertyTemplate.name,
                customText: subTextString,
            }),

            confirmButtonText: intl.formatMessage({id: 'CardDetailProperty.property-change-action-button', defaultMessage: 'Change property'}),
            onConfirm: async () => {
                setShowConfirmationDialog(false)
                try {
                    await mutator.changePropertyTypeAndName(props.board, pages as any, propertyTemplate, newType.type, newName)
                } catch (err: any) {
                    Utils.logError(`Error Changing Property And Name:${propertyTemplate.name}: ${err?.toString()}`)
                }
                sendFlashMessage({content: intl.formatMessage({id: 'CardDetailProperty.property-changed', defaultMessage: 'Changed property successfully!'}), severity: 'high'})
            },
            onClose: () => setShowConfirmationDialog(false),
        })

        // open confirmation dialog for property type change
        setShowConfirmationDialog(true)
    }

    function onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate: IPropertyTemplate) {
        // set ConfirmationDialogBox Props
        setConfirmationDialogBox({
            heading: intl.formatMessage({id: 'CardDetailProperty.confirm-delete-heading', defaultMessage: 'Confirm delete property'}),
            subText: intl.formatMessage({
                id: 'CardDetailProperty.confirm-delete-subtext',
                defaultMessage: 'Are you sure you want to delete the property "{propertyName}"? Deleting it will delete the property from all cards in this board.',
            },
            {propertyName: propertyTemplate.name}),
            confirmButtonText: intl.formatMessage({id: 'CardDetailProperty.delete-action-button', defaultMessage: 'Delete'}),
            onConfirm: async () => {
                const deletingPropName = propertyTemplate.name
                setShowConfirmationDialog(false)
                try {
                    await mutator.deleteProperty(props.board, [], pages as any, propertyTemplate.id)
                    sendFlashMessage({content: intl.formatMessage({id: 'CardDetailProperty.property-deleted', defaultMessage: 'Deleted {propertyName} successfully!'}, {propertyName: deletingPropName}), severity: 'high'})
                } catch (err: any) {
                    Utils.logError(`Error Deleting Property!: Could Not delete Property -" + ${deletingPropName} ${err?.toString()}`)
                }
            },

            onClose: () => setShowConfirmationDialog(false),
        })

        // open confirmation dialog property delete
        setShowConfirmationDialog(true)
    }

    return (
        <div
            className='PageComponent'
        >
            {showConfirmationDialog && (
                <ConfirmationDialogBox
                    dialogBox={confirmationDialogBox}
                />
            )}

            <div className='top-head'>
                <div className='mid-head'>
                    <FormattingMenu/>
                    <div className='shareButtonWrapper'>
                        {showShareButton &&
                            <ShareBoardButton
                                enableSharedBoards={props.clientConfig?.enablePublicSharedBoards || false}
                            />}
                        {showShareLoginButton &&
                            <ShareBoardLoginButton/>}
                        <ShareBoardTourStep/>
                    </div>
                    <Button
                        onClick={() => console.log('TODO')}
                        size='small'
                        icon={<CompassIcon icon='message-text-outline'/>}
                    >
                        8
                    </Button>
                    <IconButton
                        size='small'
                        onClick={() => console.log('TODO')}
                        icon={<CompassIcon icon='star-outline'/>}
                    />
                    <IconButton
                        size='small'
                        onClick={() => console.log('TODO')}
                        icon={<CompassIcon icon='information-outline'/>}
                    />
                    <PageMenu
                        pageId={activePage?.id}
                        onClickDelete={async () => {
                            if (!activePage) {
                                Utils.assertFailure()
                                return
                            }
                            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeletePage, {board: props.board.id, page: activePage.id})
                            await mutator.deleteBlock(activePage, 'delete page')
                            props.showPage(undefined)
                        }}
                        onClickDuplicate={async () => {
                            if (!activePage) {
                                Utils.assertFailure()
                                return
                            }
                            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicatePage, {board: props.board.id, page: activePage.id})
                            await mutator.duplicatePage(
                                activePage.id,
                                props.board.id,
                                'duplicate page',
                                async (newPageId: string) => {
                                    props.showPage(newPageId)
                                },
                                async () => {
                                    props.showPage(activePage.id)
                                },
                            )
                        }}
                        onClickAddSubpage={async () => {
                            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateSubpage, {board: props.board.id, page: activePage?.id})
                            const subpage = createPage()
                            subpage.parentId = activePage?.id || props.board.id
                            subpage.boardId = props.board.id
                            subpage.title = intl.formatMessage({id: 'View.NewPageTitle', defaultMessage: 'New Sub Page'})
                            await mutator.insertBlock(
                                props.board.id,
                                subpage,
                                intl.formatMessage({id: 'Mutator.new-subpage', defaultMessage: 'new subpage'}),
                                async (newBlock: Block) => {
                                    props.showPage(newBlock.id)
                                },
                                async () => {
                                    props.showPage(activePage?.id)
                                },
                            )
                        }}
                    />
                </div>
            </div>

            <div className={expanded ? 'content expanded' : 'content'}>
                <div className='doc-header'>
                    <Breadcrumbs
                        board={props.board}
                        activePage={activePage}
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
                            values={{date: Utils.relativeDisplayDateTime(new Date(activePage.updateAt), intl)}}
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

                <div className='properties'>
                    {props.board.cardProperties.map((propertyTemplate: IPropertyTemplate) => {
                        return (
                            <div
                                key={propertyTemplate.id + '-' + propertyTemplate.type}
                                className='octo-propertyrow'
                            >
                                {(props.readonly || !canEditBoardProperties) && <div className='octo-propertyname octo-propertyname--readonly'>{propertyTemplate.name}</div>}
                                {!props.readonly && canEditBoardProperties &&
                                    <MenuWrapper isOpen={propertyTemplate.id === newTemplateId}>
                                        <div className='octo-propertyname'><Button>{propertyTemplate.name}</Button></div>
                                        <PropertyMenu
                                            propertyId={propertyTemplate.id}
                                            propertyName={propertyTemplate.name}
                                            propertyType={propRegistry.get(propertyTemplate.type)}
                                            onTypeAndNameChanged={(newType: PropertyType, newName: string) => onPropertyChangeSetAndOpenConfirmationDialog(newType, newName, propertyTemplate)}
                                            onDelete={() => onPropertyDeleteSetAndOpenConfirmationDialog(propertyTemplate)}
                                        />
                                    </MenuWrapper>
                                }
                                <PropertyValueElement
                                    readOnly={props.readonly || !canEditBoardCards}
                                    card={pseudoCard}
                                    board={props.board}
                                    propertyTemplate={propertyTemplate}
                                    showEmptyPlaceholder={true}
                                />
                            </div>
                        )
                    })}
                </div>

                <BlocksEditor
                    readonly={props.readonly || !canEditBoardCards}
                    onBlockCreated={async (block: any, afterBlock: any): Promise<BlockData|null> => {
                        if (block.contentType === 'text' && block.value === '') {
                            return null
                        }
                        let newBlock: Block
                        if (block.contentType === 'checkbox') {
                            newBlock = await addBlockNewEditor(activePage, intl, block.value.value, {value: block.value.checked}, block.contentType, afterBlock?.id, dispatch)
                        } else if (block.contentType === 'image' || block.contentType === 'attachment' || block.contentType === 'video') {
                            const newFileId = await octoClient.uploadFile(activePage.boardId, block.value.file)
                            newBlock = await addBlockNewEditor(activePage, intl, '', {fileId: newFileId, filename: block.value.filename}, block.contentType, afterBlock?.id, dispatch)
                        } else {
                            newBlock = await addBlockNewEditor(activePage, intl, block.value, {}, block.contentType, afterBlock?.id, dispatch)
                        }
                        return {...block, id: newBlock.id}
                    }}
                    onBlockModified={async (block: any): Promise<BlockData<any>|null> => {
                        const originalContentBlock = currentPageContents.flatMap((b) => b).find((b) => b.id === block.id)
                        if (!originalContentBlock) {
                            return null
                        }

                        if (block.contentType === 'text' && block.value === '') {
                            const description = intl.formatMessage({id: 'ContentBlock.DeleteAction', defaultMessage: 'delete'})

                            mutator.deleteBlock(originalContentBlock, description)
                            return null
                        }
                        const newBlock = {
                            ...originalContentBlock,
                            title: block.value,
                        }

                        if (block.contentType === 'checkbox') {
                            newBlock.title = block.value.value
                            newBlock.fields = {...newBlock.fields, value: block.value.checked}
                        }
                        mutator.updateBlock(props.board.id, newBlock, originalContentBlock, intl.formatMessage({id: 'ContentBlock.editCardText', defaultMessage: 'edit card content'}))
                        return block
                    }}
                    onBlockMoved={async (block: BlockData, beforeBlock: BlockData|null, afterBlock: BlockData|null): Promise<void> => {
                        if (block.id) {
                            let contentOrder: Array<string|string[]> = props.board.properties.contentOrder as string[]
                            if (props.activePage) {
                                contentOrder = props.activePage.fields.contentOrder
                            }
                            const idx = contentOrder.indexOf(block.id)
                            let sourceBlockId: string
                            let sourceWhere: 'after'|'before'
                            if (idx === -1) {
                                Utils.logError('Unable to find the block id in the order of the current block')
                                return
                            }
                            if (idx === 0) {
                                sourceBlockId = contentOrder[1] as string
                                sourceWhere = 'before'
                            } else {
                                sourceBlockId = contentOrder[idx - 1] as string
                                sourceWhere = 'after'
                            }
                            if (afterBlock && afterBlock.id) {
                                await mutator.moveContentBlock(block.id, afterBlock.id, 'after', sourceBlockId, sourceWhere, intl.formatMessage({id: 'ContentBlock.moveBlock', defaultMessage: 'move card content'}))
                                return
                            }
                            if (beforeBlock && beforeBlock.id) {
                                await mutator.moveContentBlock(block.id, beforeBlock.id, 'before', sourceBlockId, sourceWhere, intl.formatMessage({id: 'ContentBlock.moveBlock', defaultMessage: 'move card content'}))
                            }
                        }
                    }}
                    blocks={pageBlocks}
                />
            </div>
        </div>
    )
}

export default React.memo(CenterPanelPages)
