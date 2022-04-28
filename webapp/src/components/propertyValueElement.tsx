// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useCallback, useEffect, useRef} from 'react'
import {useIntl} from 'react-intl'

import {Board, IPropertyOption, IPropertyTemplate, PropertyType} from '../blocks/board'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import {OctoUtils} from '../octoUtils'
import {Utils, IDType} from '../utils'
import Editable from '../widgets/editable'
import Switch from '../widgets/switch'

import UserProperty from './properties/user/user'
import MultiSelectProperty from './properties/multiSelect/multiSelect'
import URLProperty from './properties/link/link'
import LastModifiedBy from './properties/lastModifiedBy/lastModifiedBy'
import LastModifiedAt from './properties/lastModifiedAt/lastModifiedAt'
import CreatedAt from './properties/createdAt/createdAt'
import CreatedBy from './properties/createdBy/createdBy'
import DateRange from './properties/dateRange/dateRange'
import SelectProperty from './properties/select/select'

type Props = {
    board: Board
    readOnly: boolean
    card: Card
    propertyTemplate: IPropertyTemplate
    showEmptyPlaceholder: boolean
}

const PropertyValueElement = (props:Props): JSX.Element => {
    const [value, setValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '')
    const [serverValue, setServerValue] = useState(props.card.fields.properties[props.propertyTemplate.id] || '')

    const {card, propertyTemplate, readOnly, showEmptyPlaceholder, board} = props

    const intl = useIntl()
    const propertyValue = card.fields.properties[propertyTemplate.id]
    const displayValue = OctoUtils.propertyDisplayValue(card, propertyValue, propertyTemplate, intl)
    const emptyDisplayValue = showEmptyPlaceholder ? intl.formatMessage({id: 'PropertyValueElement.empty', defaultMessage: 'Empty'}) : ''
    const finalDisplayValue = displayValue || emptyDisplayValue

    const editableFields: Array<PropertyType> = ['text', 'number', 'email', 'url', 'phone']

    const saveTextProperty = useCallback(() => {
        if (editableFields.includes(props.propertyTemplate.type)) {
            if (value !== (props.card.fields.properties[props.propertyTemplate.id] || '')) {
                mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, value)
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

    const onDeleteValue = useCallback(() => mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, ''), [card, propertyTemplate.id])
    const onDeleteValueInMultiselect = useCallback((valueToDelete: IPropertyOption, currentValues: IPropertyOption[]) => {
        const newValues = currentValues.
            filter((currentValue) => currentValue.id !== valueToDelete.id).
            map((currentValue) => currentValue.id)
        mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, newValues)
    }, [props.board.id, card, propertyTemplate.id])
    const onCreateValueInMultiselect = useCallback((newValue: string, currentValues: IPropertyOption[]) => {
        const option: IPropertyOption = {
            id: Utils.createGuid(IDType.BlockID),
            value: newValue,
            color: 'propColorDefault',
        }
        currentValues.push(option)
        mutator.insertPropertyOption(board.id, board.cardProperties, propertyTemplate, option, 'add property option').then(() => {
            mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, currentValues.map((v: IPropertyOption) => v.id))
        })
    }, [board, props.board.id, card, propertyTemplate])
    const onChangeUser = useCallback((newValue) => mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, newValue), [props.board.id, card, propertyTemplate.id])
    const onCancelEditable = useCallback(() => setValue(propertyValue || ''), [propertyValue])
    const onChangeDateRange = useCallback((newValue) => {
        if (value !== newValue) {
            setValue(newValue)
            mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, newValue)
        }
    }, [value, props.board.id, card, propertyTemplate.id])
    const onChangeInMultiselect = useCallback((newValue) => mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, newValue), [props.board.id, card, propertyTemplate])
    const onChangeColorInMultiselect = useCallback((option: IPropertyOption, colorId: string) => mutator.changePropertyOptionColor(board.id, board.cardProperties, propertyTemplate, option, colorId), [board, propertyTemplate])
    const onDeleteOptionInMultiselect = useCallback((option: IPropertyOption) => mutator.deletePropertyOption(board.id, board.cardProperties, propertyTemplate, option), [board, propertyTemplate])

    const onCreateInSelect = useCallback((newValue) => {
        const option: IPropertyOption = {
            id: Utils.createGuid(IDType.BlockID),
            value: newValue,
            color: 'propColorDefault',
        }
        mutator.insertPropertyOption(board.id, board.cardProperties, propertyTemplate, option, 'add property option').then(() => {
            mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, option.id)
        })
    }, [board, props.board.id, card, propertyTemplate.id])

    const onChangeInSelect = useCallback((newValue) => mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, newValue), [props.board.id, card, propertyTemplate])
    const onChangeColorInSelect = useCallback((option: IPropertyOption, colorId: string) => mutator.changePropertyOptionColor(board.id, board.cardProperties, propertyTemplate, option, colorId), [board, propertyTemplate])
    const onDeleteOptionInSelect = useCallback((option: IPropertyOption) => mutator.deletePropertyOption(board.id, board.cardProperties, propertyTemplate, option), [board, propertyTemplate])

    const validateProp = useCallback((val: string): boolean => {
        if (val === '') {
            return true
        }
        switch (propertyTemplate.type) {
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
    }, [propertyTemplate.type])

    if (propertyTemplate.type === 'multiSelect') {
        return (
            <MultiSelectProperty
                isEditable={!readOnly && Boolean(board)}
                emptyValue={emptyDisplayValue}
                propertyTemplate={propertyTemplate}
                propertyValue={propertyValue}
                onChange={onChangeInMultiselect}
                onChangeColor={onChangeColorInMultiselect}
                onDeleteOption={onDeleteOptionInMultiselect}
                onCreate={onCreateValueInMultiselect}
                onDeleteValue={onDeleteValueInMultiselect}
            />
        )
    }

    if (propertyTemplate.type === 'select') {
        return (
            <SelectProperty
                isEditable={!readOnly && Boolean(board)}
                emptyValue={emptyDisplayValue}
                propertyValue={propertyValue as string}
                propertyTemplate={propertyTemplate}
                onCreate={onCreateInSelect}
                onChange={onChangeInSelect}
                onChangeColor={onChangeColorInSelect}
                onDeleteOption={onDeleteOptionInSelect}
                onDeleteValue={onDeleteValue}
            />
        )
    } else if (propertyTemplate.type === 'person') {
        return (
            <UserProperty
                value={propertyValue?.toString()}
                readonly={readOnly}
                onChange={onChangeUser}
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
                showEmptyPlaceholder={showEmptyPlaceholder}
                onChange={onChangeDateRange}
            />
        )
    } else if (propertyTemplate.type === 'url') {
        return (
            <URLProperty
                value={value.toString()}
                readonly={readOnly}
                placeholder={emptyDisplayValue}
                onChange={setValue}
                onSave={saveTextProperty}
                onCancel={() => setValue(propertyValue || '')}
                validator={validateProp}
            />
        )
    } else if (propertyTemplate.type === 'checkbox') {
        return (
            <Switch
                isOn={Boolean(propertyValue)}
                onChanged={(newBool) => {
                    const newValue = newBool ? 'true' : ''
                    mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, newValue)
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
            />
        )
    } else if (propertyTemplate.type === 'createdTime') {
        return (
            <CreatedAt createAt={card.createAt}/>
        )
    } else if (propertyTemplate.type === 'updatedTime') {
        return (
            <LastModifiedAt card={card}/>
        )
    }

    if (
        editableFields.includes(propertyTemplate.type)
    ) {
        if (!readOnly) {
            return (
                <Editable
                    className='octo-propertyvalue'
                    placeholderText={emptyDisplayValue}
                    value={value.toString()}
                    autoExpand={true}
                    onChange={setValue}
                    onSave={saveTextProperty}
                    onCancel={onCancelEditable}
                    validator={validateProp}
                    spellCheck={propertyTemplate.type === 'text'}
                />
            )
        }
        return <div className='octo-propertyvalue octo-propertyvalue--readonly'>{displayValue}</div>
    }
    return <div className='octo-propertyvalue'>{finalDisplayValue}</div>
}

export default PropertyValueElement
