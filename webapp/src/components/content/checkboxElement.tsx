// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {MutableCheckboxBlock} from '../../blocks/checkboxBlock'
import {IContentBlock} from '../../blocks/contentBlock'
import CheckIcon from '../../widgets/icons/check'
import mutator from '../../mutator'
import {Editable} from '../editable'

import {contentRegistry} from './contentRegistry'
import './checkboxElement.scss'

type Props = {
    block: IContentBlock
    readonly: boolean
    intl: IntlShape
}

type State = {
    active: boolean
    title: string
}

class CheckboxElement extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {active: props.block.fields?.value, title: props.block.title}
    }

    render(): JSX.Element {
        const {intl, block, readonly} = this.props

        return (
            <div className='CheckboxElement'>
                <input
                    type='checkbox'
                    id={`checkbox-${block.id}`}
                    disabled={readonly}
                    checked={this.state.active}
                    onChange={() => {
                        const newBlock = new MutableCheckboxBlock(block)
                        if (newBlock.fields) {
                            newBlock.fields.value = !this.state.active
                        } else {
                            newBlock.fields = {value: !this.state.active}
                        }
                        newBlock.title = this.state.title
                        this.setState({active: newBlock.fields.value})
                        mutator.updateBlock(newBlock, block, intl.formatMessage({id: 'ContentBlock.editCardCheckbox', defaultMessage: 'toggled-checkbox'}))
                    }}
                />
                <Editable
                    text={block.title}
                    placeholderText={intl.formatMessage({id: 'ContentBlock.editText', defaultMessage: 'Edit text...'})}
                    onChanged={(text) => {
                        this.setState({title: text})
                        const newBlock = new MutableCheckboxBlock(block)
                        newBlock.title = text
                        if (newBlock.fields) {
                            newBlock.fields.value = this.state.active
                        } else {
                            newBlock.fields = {value: this.state.active}
                        }
                        mutator.updateBlock(newBlock, block, intl.formatMessage({id: 'ContentBlock.editCardCheckboxText', defaultMessage: 'edit card text'}))
                    }}
                    readonly={readonly}
                />
            </div>
        )
    }
}

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
