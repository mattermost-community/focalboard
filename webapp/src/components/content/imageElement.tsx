// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock} from '../../blocks/contentBlock'
import octoClient from '../../octoClient'

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

export default injectIntl(ImageElement)
