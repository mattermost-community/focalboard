// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect, useCallback} from 'react'
import {ImageBlock, createImageBlock} from '../../blocks/imageBlock'
import octoClient from '../../octoClient'
import mutator from '../../mutator'

export default function useImagePaste(cardId: string, contentOrder: Array<string | string[]>, rootId: string): void {
    const uploadItems = useCallback(async (items: FileList) => {
        let newImage: File|null = null
        const uploads: Promise<string|undefined>[] = []
        for (const item of items) {
            console.log("ITEM", item)
            newImage = item
            if (newImage?.type.indexOf('image/') === 0) {
                uploads.push(octoClient.uploadFile(rootId, newImage))
            }
        }

        const uploaded = await Promise.all(uploads)
        const blocksToInsert: ImageBlock[] = []
        for (const fileId of uploaded) {
            if (!fileId) {
                continue
            }
            const block = createImageBlock()
            block.parentId = cardId
            block.rootId = rootId
            block.fields.fileId = fileId || ''
            blocksToInsert.push(block)
        }
        mutator.performAsUndoGroup(async () => {
            await mutator.insertBlocks(blocksToInsert, 'pasted images')
            const newContentOrder = [...contentOrder, ...blocksToInsert.map((b: ImageBlock) => b.id)]
            return mutator.changeCardContentOrder(cardId, contentOrder, newContentOrder, 'paste image')
        })
    }, [cardId, contentOrder, rootId])

    const onDrop = useCallback(async (event: DragEvent): Promise<void> => {
        if (!event.dataTransfer) {
            return
        }
        const items = (event.dataTransfer).files
        uploadItems(items)
    }, [cardId, contentOrder, rootId])

    const onPaste = useCallback(async (event: ClipboardEvent): Promise<void> => {
        if (!event.clipboardData) {
            return
        }
        const items = (event.clipboardData).files
        uploadItems(items)
    }, [cardId, contentOrder, rootId])

    useEffect(() => {
        document.addEventListener('paste', onPaste)
        document.addEventListener('drop', onDrop)
        return () => {
            document.removeEventListener('paste', onPaste)
            document.removeEventListener('drop', onDrop)
        }
    }, [])
}
