// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'

import {ContentBlock} from '../../blocks/contentBlock'
import {ImageBlock, createImageBlock} from '../../blocks/imageBlock'
import octoClient from '../../octoClient'
import {Utils} from '../../utils'
import ImageIcon from '../../widgets/icons/image'

import {contentRegistry} from './contentRegistry'

type Props = {
    block: ContentBlock
}

const ImageElement = React.memo((props: Props): JSX.Element|null => {
    const [imageDataUrl, setImageDataUrl] = useState<string|null>(null)

    const {block} = props

    useEffect(() => {
        if (!imageDataUrl) {
            const loadImage = async () => {
                const url = await octoClient.getFileAsDataUrl(block.rootId, props.block.fields.fileId)
                setImageDataUrl(url)
            }
            loadImage()
        }
    })

    if (!imageDataUrl) {
        return null
    }

    return (
        <img
            className='ImageElement'
            src={imageDataUrl}
            alt={block.title}
        />
    )
})

contentRegistry.registerContentType({
    type: 'image',
    getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.image', defaultMessage: 'image'}),
    getIcon: () => <ImageIcon/>,
    createBlock: async (rootId: string) => {
        return new Promise<ImageBlock>(
            (resolve) => {
                Utils.selectLocalFile(async (file) => {
                    const fileId = await octoClient.uploadFile(rootId, file)

                    const block = createImageBlock()
                    block.fields.fileId = fileId || ''
                    resolve(block)
                },
                '.jpg,.jpeg,.png')
            },
        )

        // return new ImageBlock()
    },
    createComponent: (block) => <ImageElement block={block}/>,
})

export default ImageElement
