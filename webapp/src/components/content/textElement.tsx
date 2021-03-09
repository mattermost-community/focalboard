// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IContentBlock} from '../../blocks/contentBlock'
import mutator from '../../mutator'
import {MarkdownEditor} from '../markdownEditor'

type Props = {
    block: IContentBlock
    readonly: boolean
    intl: IntlShape
}

class TextElement extends React.PureComponent<Props> {
    public render(): JSX.Element {
        const {intl, block, readonly} = this.props

        return (
            <MarkdownEditor
                text={block.title}
                placeholderText={intl.formatMessage({id: 'ContentBlock.editText', defaultMessage: 'Edit text...'})}
                onBlur={(text) => {
                    mutator.changeTitle(block, text, intl.formatMessage({id: 'ContentBlock.editCardText', defaultMessage: 'edit card text'}))
                }}
                readonly={readonly}
            />
        )
    }
}

export default injectIntl(TextElement)
