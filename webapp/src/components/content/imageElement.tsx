// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock, MutableContentBlock} from '../../blocks/contentBlock'
import {MutableImageBlock} from '../../blocks/imageBlock'
import mutator from '../../mutator'
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
    createBlock: () => {
        return new MutableImageBlock()
    },
    addBlock: (card, contents, index, intl) => {
        Utils.selectLocalFile((file) => {
            mutator.performAsUndoGroup(async () => {
                const typeName = intl.formatMessage({id: 'ContentBlock.image', defaultMessage: 'image'})
                const description = intl.formatMessage({id: 'ContentBlock.addElement', defaultMessage: 'add {type}'}, {type: typeName})
                const newBlock = await mutator.createImageBlock(card, file, description)
                if (newBlock) {
                    const contentOrder = contents.map((o) => o.id)
                    contentOrder.splice(index, 0, newBlock.id)
                    await mutator.changeCardContentOrder(card, contentOrder, description)
                }
            })
        },
        '.jpg,.jpeg,.png')
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
