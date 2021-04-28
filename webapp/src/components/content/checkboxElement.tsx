// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {MutableCheckboxBlock} from '../../blocks/checkboxBlock'
import {IContentBlock} from '../../blocks/contentBlock'
import CheckIcon from '../../widgets/icons/check'
import mutator from '../../mutator'
import Editable from '../../widgets/editable'

import {contentRegistry} from './contentRegistry'
import './checkboxElement.scss'

type Props = {
    block: IContentBlock
    readonly: boolean
    intl: IntlShape
}

const CheckboxElement = React.memo((props: Props) => {
    const {intl, block, readonly} = props

    const [active, setActive] = useState(Boolean(block.fields.value))
    const [title, setTitle] = useState(block.title)

    return (
        <div className='CheckboxElement'>
            <input
                type='checkbox'
                id={`checkbox-${block.id}`}
                disabled={readonly}
                checked={active}
                value={active ? 'on' : 'off'}
                onChange={(e) => {
                    e.preventDefault()
                    const newBlock = new MutableCheckboxBlock(block)
                    newBlock.fields.value = !active
                    newBlock.title = title
                    setActive(newBlock.fields.value)
                    mutator.updateBlock(newBlock, block, intl.formatMessage({id: 'ContentBlock.editCardCheckbox', defaultMessage: 'toggled-checkbox'}))
                }}
            />
            <Editable
                value={title}
                placeholderText={intl.formatMessage({id: 'ContentBlock.editText', defaultMessage: 'Edit text...'})}
                onChange={setTitle}
                onSave={() => {
                    const newBlock = new MutableCheckboxBlock(block)
                    newBlock.title = title
                    newBlock.fields.value = active
                    mutator.updateBlock(newBlock, block, intl.formatMessage({id: 'ContentBlock.editCardCheckboxText', defaultMessage: 'edit card text'}))
                }}
                readonly={readonly}
            />
        </div>
    )
})

contentRegistry.registerContentType({
    type: 'checkbox',
    getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.checkbox', defaultMessage: 'checkbox'}),
    getIcon: () => <CheckIcon/>,
    createBlock: async () => {
        return new MutableCheckboxBlock()
    },
    createComponent: (block, intl, readonly) => {
        return (
            <CheckboxElement
                block={block}
                intl={intl}
                readonly={readonly}
            />
        )
    },
})

export default injectIntl(CheckboxElement)
