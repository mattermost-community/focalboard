// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock} from '../../blocks/contentBlock'
import {MutableImageBlock} from '../../blocks/imageBlock'
import octoClient from '../../octoClient'
import {Utils} from '../../utils'
import ImageIcon from '../../widgets/icons/image'

import {contentRegistry} from './contentRegistry'

type Props = {
    block: IContentBlock
    intl: IntlShape
}

type State = {
    imageDataUrl?: string
}

class ImageElement extends React.PureComponent<Props> {
    state: State = {}

    componentDidMount(): void {
        if (!this.state.imageDataUrl) {
            this.loadImage()
        }
    }

    private async loadImage() {
        const imageDataUrl = await octoClient.getFileAsDataUrl(this.props.block.fields.fileId)
        this.setState({imageDataUrl})
    }

    public render(): JSX.Element | null {
        const {block} = this.props
        const {imageDataUrl} = this.state

        if (!imageDataUrl) {
            return null
        }

        return (
            <img
                src={imageDataUrl}
                alt={block.title}
            />
        )
    }
}

contentRegistry.registerContentType({
    type: 'image',
    getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.image', defaultMessage: 'image'}),
    getIcon: () => <ImageIcon/>,
    createBlock: async () => {
        return new Promise<MutableImageBlock>(
            (resolve) => {
                Utils.selectLocalFile(async (file) => {
                    const fileId = await octoClient.uploadFile(file)

                    const block = new MutableImageBlock()
                    block.fileId = fileId || ''
                    resolve(block)
                },
                '.jpg,.jpeg,.png')
            },
        )

        // return new MutableImageBlock()
    },
    createComponent: (block, intl) => {
        return (
            <ImageElement
                block={block}
                intl={intl}
            />
        )
    },
})

export default injectIntl(ImageElement)
