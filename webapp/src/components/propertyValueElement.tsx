// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {Card} from '../blocks/card'
import {IPropertyTemplate, IPropertyOption} from '../blocks/board'
import {OctoUtils} from '../octoUtils'
import mutator from '../mutator'
import {Utils} from '../utils'
import {BoardTree} from '../viewModel/boardTree'

import Editable from '../widgets/editable'
import MenuWrapper from '../widgets/menuWrapper'
import Menu from '../widgets/menu'
import ValueSelector from '../widgets/valueSelector'
import {skipPartiallyEmittedExpressions} from 'typescript'

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
            let className = 'octo-button octo-propertyvalue'
            if (!displayValue) {
                className += ' empty'
            }

            if (readOnly) {
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
                            await mutator.insertPropertyOption(this.props.boardTree, propertyTemplate, option, 'add property option')
                            mutator.changePropertyValue(card, propertyTemplate.id, option.id)
                        }
                    }
                />
            )
        }

        if (propertyTemplate.type === 'text' || propertyTemplate.type === 'number') {
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
