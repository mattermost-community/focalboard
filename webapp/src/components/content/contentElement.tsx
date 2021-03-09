// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock} from '../../blocks/contentBlock'

import contentRegistry from './contentRegistry'

type Props = {
    block: IContentBlock
    readonly: boolean
    intl: IntlShape
}

class ContentElement extends React.PureComponent<Props> {
    public render(): JSX.Element | null {
        const {block, readonly} = this.props

        return contentRegistry.createComponent(block, readonly) || null
    }
}

export default injectIntl(ContentElement)
