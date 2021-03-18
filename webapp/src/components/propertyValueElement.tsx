// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {IPropertyOption, IPropertyTemplate} from '../blocks/board'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import {OctoUtils} from '../octoUtils'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'
import Editable from '../widgets/editable'
import ValueSelector from '../widgets/valueSelector'

type Props = {
    boardTree?: BoardTree
    readOnly: boolean
    card: Card
    propertyTemplate: IPropertyTemplate
    emptyDisplayValue: string
}

type State = {
    value: string
}

export default class PropertyValueElement extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        const propertyValue = props.card.properties[props.propertyTemplate.id]
        this.state = {value: propertyValue}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): JSX.Element {
        const {card, propertyTemplate, readOnly, emptyDisplayValue, boardTree} = this.props
        const propertyValue = card.properties[propertyTemplate.id]
        const displayValue = OctoUtils.propertyDisplayValue(card, propertyValue, propertyTemplate)
        const finalDisplayValue = displayValue || emptyDisplayValue

        let propertyColorCssClassName = ''
        if (propertyValue && propertyTemplate.type === 'select') {
            const cardPropertyValue = propertyTemplate.options.find((o) => o.id === propertyValue)
            if (cardPropertyValue) {
                propertyColorCssClassName = cardPropertyValue.color
            }
        }

        if (propertyTemplate.type === 'select') {
            let className = 'octo-propertyvalue octo-label'
            if (!displayValue) {
                className += ' empty'
            }

            if (readOnly || !boardTree) {
                return (
                    <div
                        className={`${className} ${propertyColorCssClassName}`}
                        tabIndex={0}
                    >
                        {finalDisplayValue}
                    </div>
                )
            }
            return (
                <ValueSelector
                    emptyValue={emptyDisplayValue}
                    options={propertyTemplate.options}
                    value={propertyTemplate.options.find((p) => p.id === propertyValue)}
                    onChange={(value) => {
                        mutator.changePropertyValue(card, propertyTemplate.id, value)
                    }}
                    onChangeColor={(option: IPropertyOption, colorId: string): void => {
                        mutator.changePropertyOptionColor(boardTree.board, propertyTemplate, option, colorId)
                    }}
                    onDeleteOption={(option: IPropertyOption): void => {
                        mutator.deletePropertyOption(boardTree, propertyTemplate, option)
                    }}
                    onCreate={
                        async (value) => {
                            const option: IPropertyOption = {
                                id: Utils.createGuid(),
                                value,
                                color: 'propColorDefault',
                            }
                            await mutator.insertPropertyOption(boardTree, propertyTemplate, option, 'add property option')
                            mutator.changePropertyValue(card, propertyTemplate.id, option.id)
                        }
                    }
                />
            )
        }

        if (propertyTemplate.type === 'text' || propertyTemplate.type === 'number' || propertyTemplate.type === 'email') {
            if (!readOnly) {
                return (
                    <Editable
                        className='octo-propertyvalue'
                        placeholderText='Empty'
                        value={this.state.value}
                        onChange={(value) => this.setState({value})}
                        onSave={() => mutator.changePropertyValue(card, propertyTemplate.id, this.state.value)}
                        onCancel={() => this.setState({value: propertyValue})}
                    />
                )
            }
            return <div className='octo-propertyvalue'>{displayValue}</div>
        }
        return <div className='octo-propertyvalue'>{finalDisplayValue}</div>
    }
}
