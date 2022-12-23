// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useMemo} from 'react'
import {useIntl, IntlShape} from 'react-intl'

import {Block, ContentBlockTypes, createBlock} from '../../blocks/block'
import {Board} from '../../blocks/board'
import {Page} from '../../blocks/page'
import {useAppSelector, useAppDispatch} from '../../store/hooks'
import {updatePages} from '../../store/pages'
import {updateContents, getCurrentPageContents} from '../../store/contents'
import mutator from '../../mutator'
import {Utils} from '../../utils'

import octoClient from '../../octoClient'

import BlocksEditor from '../blocksEditor/blocksEditor'
import {BlockData} from '../blocksEditor/blocks/types'

import './pageBlocks.scss'

async function addBlockNewEditor(page: any, intl: IntlShape, title: string, fields: any, contentType: ContentBlockTypes, afterBlockId: string, dispatch: any): Promise<Block> {
    const block = createBlock()
    block.parentId = page.id
    block.boardId = page.boardId
    block.title = title
    block.type = contentType
    block.fields = {...block.fields, ...fields}

    const description = intl.formatMessage({id: 'CardDetail.addCardText', defaultMessage: 'add page text'})

    const afterRedo = async (newBlock: Block) => {
        const contentOrder = page.fields?.contentOrder.slice()
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
        await octoClient.patchBlock(page.boardId, page.id, {updatedFields: {contentOrder}})
        dispatch(updatePages([{...page, fields: {...page.fields, contentOrder}}]))
    }

    const beforeUndo = async () => {
        const contentOrder = page.fields.contentOrder.slice()
        await octoClient.patchBlock(page.boardId, page.id, {updatedFields: {contentOrder}})
    }

    const newBlock = await mutator.insertBlock(block.boardId, block, description, afterRedo, beforeUndo)
    dispatch(updateContents([newBlock]))
    return newBlock
}

type Props = {
    activePage: Page
    board: Board
    readonly: boolean
    canEditBoardCards: boolean
}

const PageBlocks = (props: Props) => {
    const intl = useIntl()
    const dispatch = useAppDispatch()
    const currentPageContents = useAppSelector(getCurrentPageContents)

    const onBlockCreated = useCallback(async (block: any, afterBlock: any): Promise<BlockData|null> => {
        if (block.contentType === 'text' && block.value === '') {
            return null
        }
        let newBlock: Block
        if (block.contentType === 'checkbox') {
            newBlock = await addBlockNewEditor(props.activePage, intl, block.value.value, {value: block.value.checked}, block.contentType, afterBlock?.id, dispatch)
        } else if (block.contentType === 'image' || block.contentType === 'attachment' || block.contentType === 'video') {
            const newFileId = await octoClient.uploadFile(props.activePage.boardId, block.value.file)
            newBlock = await addBlockNewEditor(props.activePage, intl, '', {fileId: newFileId, filename: block.value.filename}, block.contentType, afterBlock?.id, dispatch)
        } else {
            newBlock = await addBlockNewEditor(props.activePage, intl, block.value, {}, block.contentType, afterBlock?.id, dispatch)
        }
        return {...block, id: newBlock.id}
    }, [props.activePage])

    const onBlockModified = useCallback(async (block: any): Promise<BlockData<any>|null> => {
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
    }, [props.board.id, currentPageContents])

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

    const onBlockMoved = useCallback(async (block: BlockData, beforeBlock: BlockData|null, afterBlock: BlockData|null): Promise<void> => {
        if (block.id) {
            const contentOrder = props.activePage.fields.contentOrder
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
    }, [props.activePage])

    return (
        <div className='PageBlocks'>
            <BlocksEditor
                readonly={props.readonly || !props.canEditBoardCards}
                onBlockCreated={onBlockCreated}
                onBlockModified={onBlockModified}
                onBlockMoved={onBlockMoved}
                blocks={pageBlocks}
            />
        </div>
    )
}

export default React.memo(PageBlocks)
