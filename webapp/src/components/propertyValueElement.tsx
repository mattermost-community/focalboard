// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState, useCallback, useEffect} from 'react'
import {useIntl} from 'react-intl'

import {Board, IPropertyOption, IPropertyTemplate} from '../blocks/board'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import {OctoUtils} from '../octoUtils'
import {Utils, IDType} from '../utils'
import Switch from '../widgets/switch'

import UserProperty from './properties/user/user'
import MultiSelectProperty from './properties/multiSelect/multiSelect'
import LastModifiedBy from './properties/lastModifiedBy/lastModifiedBy'
import LastModifiedAt from './properties/lastModifiedAt/lastModifiedAt'
import DateRange from './properties/dateRange/dateRange'
import SelectProperty from './properties/select/select'
import {propertyValueClassName} from './propertyValueUtils'

import registry from './properties'

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

    useEffect(() => {
        if (serverValue === value) {
            setValue(props.card.fields.properties[props.propertyTemplate.id] || '')
        }
        setServerValue(props.card.fields.properties[props.propertyTemplate.id] || '')
    }, [value, props.card.fields.properties[props.propertyTemplate.id]])

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
    const onChangeDateRange = useCallback((newValue) => {
        if (value !== newValue) {
            setValue(newValue)
            mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, newValue)
        }
    }, [value, props.board.id, card, propertyTemplate.id])
    const onChangeInMultiselect = useCallback((newValue) => mutator.changePropertyValue(props.board.id, card, propertyTemplate.id, newValue), [props.board.id, card, propertyTemplate])
    const onChangeColorInMultiselect = useCallback((option: IPropertyOption, colorId: string) => mutator.changePropertyOptionColor(board.id, board.cardProperties, propertyTemplate, option, colorId), [board, propertyTemplate])
    const onDeleteOptionInMultiselect = useCallback((option: IPropertyOption) => mutator.deletePropertyOption(board.id, board.cardProperties, propertyTemplate, option), [board, propertyTemplate])

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

    if (propertyTemplate.type === 'person') {
        return (
            <UserProperty
                value={propertyValue?.toString()}
                readonly={readOnly}
                onChange={onChangeUser}
            />
        )
    } else if (propertyTemplate.type === 'date') {
        const className = propertyValueClassName({readonly: readOnly})
        if (readOnly) {
            return <div className={className}>{displayValue}</div>
        }
        return (
            <DateRange
                className={className}
                value={value.toString()}
                showEmptyPlaceholder={showEmptyPlaceholder}
                onChange={onChangeDateRange}
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
    } else if (propertyTemplate.type === 'updatedBy') {
        return (
            <LastModifiedBy
                card={card}
                board={board}
            />
        )
    } else if (propertyTemplate.type === 'updatedTime') {
        return (
            <LastModifiedAt card={card}/>
        )
    }

    const property = registry.get(propertyTemplate.type)
    if (property) {
        const Editor = property.Editor
        return (
            <Editor
                card={card}
                board={board}
            />
        )
    }
    return <div className={propertyValueClassName()}>{finalDisplayValue}</div>
}

export default PropertyValueElement
