// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useContext, useEffect, useRef, useState} from 'react'
import {useIntl} from 'react-intl'

import {createCheckboxBlock} from '../../blocks/checkboxBlock'
import {ContentBlock} from '../../blocks/contentBlock'
import CheckIcon from '../../widgets/icons/check'
import mutator from '../../mutator'
import Editable, {Focusable} from '../../widgets/editable'
import CardDetailContext from '../cardDetail/cardDetailContext'

import {contentRegistry} from './contentRegistry'

import './checkboxElement.scss'

type Props = {
    block: ContentBlock
    readonly: boolean
    onAddNewElement?: () => void
    onDeleteElement?: () => void
}

const CheckboxElement = React.memo((props: Props) => {
    const {block, readonly} = props
    const intl = useIntl()
    const titleRef = useRef<Focusable>(null)
    const cardDetail = useContext(CardDetailContext)
    const [addedBlockId, setAddedBlockId] = useState(cardDetail.lastAddedBlockId)

    useEffect(() => {
        if (block.id === addedBlockId) {
            titleRef.current?.focus()
            setAddedBlockId('')
        }
    }, [block, addedBlockId, titleRef])

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
                    const newBlock = createCheckboxBlock(block)
                    newBlock.fields.value = !active
                    newBlock.title = title
                    setActive(newBlock.fields.value)
                    mutator.updateBlock(newBlock, block, intl.formatMessage({id: 'ContentBlock.editCardCheckbox', defaultMessage: 'toggled-checkbox'}))
                }}
            />
            <Editable
                ref={titleRef}
                value={title}
                placeholderText={intl.formatMessage({id: 'ContentBlock.editText', defaultMessage: 'Edit text...'})}
                onChange={setTitle}
                saveOnEsc={true}
                onSave={async (saveType) => {
                    if (title === '' && block.id === cardDetail.lastAddedBlockId && props.onDeleteElement) {
                        props.onDeleteElement()
                    } else {
                        const newBlock = createCheckboxBlock(block)
                        newBlock.title = title
                        newBlock.fields.value = active
                        await mutator.updateBlock(newBlock, block, intl.formatMessage({id: 'ContentBlock.editCardCheckboxText', defaultMessage: 'edit card text'}))
                        if (saveType === 'onEnter' && title !== '' && props.onAddNewElement) {
                            props.onAddNewElement()
                        }
                    }
                }}
                readonly={readonly}
                spellCheck={true}
            />
        </div>
    )
})

contentRegistry.registerContentType({
    type: 'checkbox',
    getDisplayText: (intl) => intl.formatMessage({id: 'ContentBlock.checkbox', defaultMessage: 'checkbox'}),
    getIcon: () => <CheckIcon/>,
    createBlock: async () => {
        return createCheckboxBlock()
    },
    createComponent: (block, readonly, onAddNewElement, onDeleteElement) => {
        return (
            <CheckboxElement
                block={block}
                readonly={readonly}
                onAddNewElement={onAddNewElement}
                onDeleteElement={onDeleteElement}
            />
        )
    },
})

export default CheckboxElement
