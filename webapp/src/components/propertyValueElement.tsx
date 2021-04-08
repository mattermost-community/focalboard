// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'

import {IPropertyOption, IPropertyTemplate} from '../blocks/board'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import {OctoUtils} from '../octoUtils'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import Editable from '../widgets/editable'
import ValueSelector from '../widgets/valueSelector'
import Label from '../widgets/label'

type Props = {
    boardTree?: BoardTree
    readOnly: boolean
    card: Card
    propertyTemplate: IPropertyTemplate
    emptyDisplayValue: string
}

const PropertyValueElement = (props:Props): JSX.Element => {
    const [value, setValue] = useState(props.card.properties[props.propertyTemplate.id])

    const {card, propertyTemplate, readOnly, emptyDisplayValue, boardTree} = props
    const propertyValue = card.properties[propertyTemplate.id]
    const displayValue = OctoUtils.propertyDisplayValue(card, propertyValue, propertyTemplate)
    const finalDisplayValue = displayValue || emptyDisplayValue

    const validateProp = (propType: string, val: string): boolean => {
        if (val === '') {
            return true
        }
        switch (propType) {
        case 'number':
            return !isNaN(parseInt(val, 10))
        case 'email': {
            const emailRegexp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            return emailRegexp.test(val.toLowerCase())
        }
        case 'url': {
            const urlRegexp = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/
            return urlRegexp.test(val.toLowerCase())
        }
        case 'text':
            return true
        default:
            return false
        }
    }

    if (propertyTemplate.type === 'select') {
        let propertyColorCssClassName = ''
        const cardPropertyValue = propertyTemplate.options.find((o) => o.id === propertyValue)
        if (cardPropertyValue) {
            propertyColorCssClassName = cardPropertyValue.color
        }

        if (readOnly || !boardTree) {
            return (
                <div
                    className='octo-property-value'
                    tabIndex={0}
                >
                    <Label color={displayValue ? propertyColorCssClassName : 'empty'}>{finalDisplayValue}</Label>
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
                    mutator.changePropertyOptionColor(boardTree.board, propertyTemplate, option, colorId)
                }}
                onDeleteOption={(option: IPropertyOption): void => {
                    mutator.deletePropertyOption(boardTree, propertyTemplate, option)
                }}
                onCreate={
                    async (newValue) => {
                        const option: IPropertyOption = {
                            id: Utils.createGuid(),
                            value: newValue,
                            color: 'propColorDefault',
                        }
                        await mutator.insertPropertyOption(boardTree, propertyTemplate, option, 'add property option')
                        mutator.changePropertyValue(card, propertyTemplate.id, option.id)
                    }
                }
            />
        )
    }

    if (
        propertyTemplate.type === 'text' ||
        propertyTemplate.type === 'number' ||
        propertyTemplate.type === 'email' ||
        propertyTemplate.type === 'url'
    ) {
        if (!readOnly) {
            return (
                <Editable
                    className='octo-propertyvalue'
                    placeholderText='Empty'
                    value={value}
                    onChange={setValue}
                    onSave={() => mutator.changePropertyValue(card, propertyTemplate.id, value)}
                    onCancel={() => setValue(propertyValue)}
                    validator={(newValue) => validateProp(propertyTemplate.type, newValue)}
                />
            )
        }
        return <div className='octo-propertyvalue'>{displayValue}</div>
    }
    return <div className='octo-propertyvalue'>{finalDisplayValue}</div>
}

export default PropertyValueElement
