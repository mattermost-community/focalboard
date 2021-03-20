// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock} from '../../blocks/contentBlock'
import {Utils} from '../../utils'

import {contentRegistry} from './contentRegistry'

// Need to require here to prevent webpack from tree-shaking these away
// TODO: Update webpack to avoid this
import './textElement'
import './imageElement'
import './dividerElement'
import './checkboxElement'

type Props = {
    block: IContentBlock
    readonly: boolean
    intl: IntlShape
}

function ContentElement(props: Props): JSX.Element|null {
    const {block, intl, readonly} = props

    const handler = contentRegistry.getHandler(block.type)
    if (!handler) {
        Utils.logError(`ContentElement, unknown content type: ${block.type}`)
        return null
    }

    return handler.createComponent(block, intl, readonly)
}

export default injectIntl(ContentElement)
