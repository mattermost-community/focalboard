// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useCallback, useEffect, useRef} from 'react'
import {useIntl} from 'react-intl'

import {Board, IPropertyOption, IPropertyTemplate, PropertyType} from '../blocks/board'
import {Card} from '../blocks/card'
import {ContentBlock} from '../blocks/contentBlock'
import {CommentBlock} from '../blocks/commentBlock'
import mutator from '../mutator'
import {OctoUtils} from '../octoUtils'
import {Utils} from '../utils'
import Editable from '../widgets/editable'
import ValueSelector from '../widgets/valueSelector'

import Label from '../widgets/label'

import Switch from '../widgets/switch'
import IconButton from '../widgets/buttons/iconButton'
import CloseIcon from '../widgets/icons/close'

import UserProperty from './properties/user/user'
import MultiSelectProperty from './properties/multiSelect'
import URLProperty from './properties/link/link'
import LastModifiedBy from './properties/lastModifiedBy/lastModifiedBy'
import LastModifiedAt from './properties/lastModifiedAt/lastModifiedAt'
import CreatedAt from './properties/createdAt/createdAt'
import CreatedBy from './properties/createdBy/createdBy'
import DateRange from './properties/dateRange/dateRange'

type Props = {
    board: Board
    readOnly: boolean
    card: Card
    contents: Array<ContentBlock|ContentBlock[]>
    comments: CommentBlock[]
    propertyTemplate: IPropertyTemplate
    emptyDisplayValue: string
}

const PropertyValueElement = (props:Props): JSX.Element => {
    const [value, setValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '')
    const [serverValue, setServerValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '')

    const {card, propertyTemplate, readOnly, emptyDisplayValue, board, contents, comments} = props
    const intl = useIntl()
    const propertyValue = card.fields.properties[propertyTemplate.id]
    const displayValue = OctoUtils.propertyDisplayValue(card, propertyValue, propertyTemplate, intl)
    const finalDisplayValue = displayValue || emptyDisplayValue
    const [open, setOpen] = useState(false)

    const editableFields: Array<PropertyType> = ['text', 'number', 'email', 'url', 'phone']

    const saveTextProperty = useCallback(() => {
        if (editableFields.includes(props.propertyTemplate.type)) {
            if (value !== (props.card.fields.properties[props.propertyTemplate.id] || '')) {
                mutator.changePropertyValue(card, propertyTemplate.id, value)
            }
        }
    }, [props.card, props.propertyTemplate, value])

    const saveTextPropertyRef = useRef<() => void>(saveTextProperty)
    saveTextPropertyRef.current = saveTextProperty

    useEffect(() => {
        if (serverValue === value) {
            setValue(props.card.fields.properties[props.propertyTemplate.id] || '')
        }
        setServerValue(props.card.fields.properties[props.propertyTemplate.id] || '')
    }, [value, props.card.fields.properties[props.propertyTemplate.id]])

    useEffect(() => {
        return () => {
            saveTextPropertyRef.current && saveTextPropertyRef.current()
        }
    }, [])

    const onDeleteValue = useCallback(() => mutator.changePropertyValue(card, propertyTemplate.id, ''), [card, propertyTemplate.id])

    const validateProp = (propType: string, val: string): boolean => {
        if (val === '') {
            return true
        }
        switch (propType) {
        case 'number':
            return !isNaN(parseInt(val, 10))
        case 'email': {
            const emailRegexp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            return emailRegexp.test(val)
        }
        case 'url': {
            const urlRegexp = /(((.+:(?:\/\/)?)?(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/
            return urlRegexp.test(val)
        }
        case 'text':
            return true
        case 'phone':
            return true
        default:
            return false
        }
    }

    if (propertyTemplate.type === 'multiSelect') {
        return (
            <MultiSelectProperty
                isEditable={!readOnly && Boolean(board)}
                emptyValue={emptyDisplayValue}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
                onChange={(newValue) => mutator.changePropertyValue(card, propertyTemplate.id, newValue)}
                onChangeColor={(option: IPropertyOption, colorId: string) => mutator.changePropertyOptionColor(board, propertyTemplate, option, colorId)}
                onDeleteOption={(option: IPropertyOption) => mutator.deletePropertyOption(board, propertyTemplate, option)}
                onCreate={
                    async (newValue, currentValues) => {
                        const option: IPropertyOption = {
                            id: Utils.createGuid(),
                            value: newValue,
                            color: 'propColorDefault',
                        }
                        currentValues.push(option)
                        await mutator.insertPropertyOption(board, propertyTemplate, option, 'add property option')
                        mutator.changePropertyValue(card, propertyTemplate.id, currentValues.map((v) => v.id))
                    }
                }
                onDeleteValue={(valueToDelete, currentValues) => mutator.changePropertyValue(card, propertyTemplate.id, currentValues.filter((currentValue) => currentValue.id !== valueToDelete.id).map((currentValue) => currentValue.id))}
            />
        )
    }

    if (propertyTemplate.type === 'select') {
        let propertyColorCssClassName = ''
        const cardPropertyValue = propertyTemplate.options.find((o) => o.id === propertyValue)
        if (cardPropertyValue) {
            propertyColorCssClassName = cardPropertyValue.color
        }

        if (readOnly || !board || !open) {
            return (
                <div
                    className='octo-propertyvalue'
                    tabIndex={0}
                    onClick={() => setOpen(true)}
                >
                    <Label color={displayValue ? propertyColorCssClassName : 'empty'}>
                        <span className='Label-text'>{finalDisplayValue}</span>
                        {displayValue && !props.readOnly &&
                            <IconButton
                                onClick={onDeleteValue}
                                onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                                icon={<CloseIcon/>}
                                title='Clear'
                                className='margin-left delete-value'
                            />}
                    </Label>
                </div>
            )
        }
        return (
            <ValueSelector
                emptyValue={emptyDisplayValue}
                options={propertyTemplate.options}
                value={propertyTemplate.options.find((p) => p.id === propertyValue)}
                onChange={(newValue) => {
                    mutator.changePropertyValue(card, propertyTemplate.id, newValue)
                }}
                onChangeColor={(option: IPropertyOption, colorId: string): void => {
                    mutator.changePropertyOptionColor(board, propertyTemplate, option, colorId)
                }}
                onDeleteOption={(option: IPropertyOption): void => {
                    mutator.deletePropertyOption(board, propertyTemplate, option)
                }}
                onCreate={
                    async (newValue) => {
                        const option: IPropertyOption = {
                            id: Utils.createGuid(),
                            value: newValue,
                            color: 'propColorDefault',
                        }
                        await mutator.insertPropertyOption(board, propertyTemplate, option, 'add property option')
                        mutator.changePropertyValue(card, propertyTemplate.id, option.id)
                    }
                }
                onDeleteValue={onDeleteValue}
            />
        )
    } else if (propertyTemplate.type === 'person') {
        return (
            <UserProperty
                value={propertyValue.toString()}
                readonly={readOnly}
                onChange={(newValue) => mutator.changePropertyValue(card, propertyTemplate.id, newValue)}
            />
        )
    } else if (propertyTemplate.type === 'date') {
        if (readOnly) {
            return <div className='octo-propertyvalue'>{displayValue}</div>
        }
        return (
            <DateRange
                className='octo-propertyvalue'
                value={value.toString()}
                onChange={(newValue) => mutator.changePropertyValue(card, propertyTemplate.id, newValue)}
            />
        )
    } else if (propertyTemplate.type === 'url') {
        return (
            <URLProperty
                value={value.toString()}
                readonly={readOnly}
                onChange={setValue}
                onSave={saveTextProperty}
                onCancel={() => setValue(propertyValue)}
                validator={(newValue) => validateProp(propertyTemplate.type, newValue)}
            />
        )
    } else if (propertyTemplate.type === 'checkbox') {
        return (
            <Switch
                isOn={Boolean(propertyValue)}
                onChanged={(newBool) => {
                    const newValue = newBool ? 'true' : ''
                    mutator.changePropertyValue(card, propertyTemplate.id, newValue)
                }}
                readOnly={readOnly}
            />
        )
    } else if (propertyTemplate.type === 'createdBy') {
        return (
            <CreatedBy userID={card.createdBy}/>
        )
    } else if (propertyTemplate.type === 'updatedBy') {
        return (
            <LastModifiedBy
                card={card}
                board={board}
                contents={contents}
                comments={comments}
            />
        )
    } else if (propertyTemplate.type === 'createdTime') {
        return (
            <CreatedAt createAt={card.createAt}/>
        )
    } else if (propertyTemplate.type === 'updatedTime') {
        return (
            <LastModifiedAt
                card={card}
                contents={contents}
                comments={comments}
            />
        )
    }

    if (
        editableFields.includes(propertyTemplate.type)
    ) {
        if (!readOnly) {
            return (
                <Editable
                    className='octo-propertyvalue'
                    placeholderText=''
                    value={value.toString()}
                    onChange={setValue}
                    onSave={saveTextProperty}
                    onCancel={() => setValue(propertyValue)}
                    validator={(newValue) => validateProp(propertyTemplate.type, newValue)}
                    spellCheck={propertyTemplate.type === 'text'}
                />
            )
        }
        return <div className='octo-propertyvalue'>{displayValue}</div>
    }
    return <div className='octo-propertyvalue'>{finalDisplayValue}</div>
}

export default PropertyValueElement
