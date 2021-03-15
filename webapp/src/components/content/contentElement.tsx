// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock} from '../../blocks/contentBlock'
import {Utils} from '../../utils'

import {contentRegistry} from './contentRegistry'

// Need to require here to prevent webpack from tree-shaking these away
// TODO: Update webpack to avoid this
import './textElement'
import './imageElement'
import './dividerElement'

type Props = {
    block: IContentBlock
    readonly: boolean
    intl: IntlShape
}

class ContentElement extends React.PureComponent<Props> {
    public render(): JSX.Element | null {
        const {block, intl, readonly} = this.props

        const handler = contentRegistry.getHandler(block.type)
        if (!handler) {
            Utils.logError(`ContentElement, unknown content type: ${block.type}`)
            return null
        }

        return handler.createComponent(block, intl, readonly)
    }
}

export default injectIntl(ContentElement)
