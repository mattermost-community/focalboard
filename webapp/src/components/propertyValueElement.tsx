// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {Card} from '../blocks/card'
import {IPropertyTemplate, IPropertyOption} from '../blocks/board'
import {OctoUtils} from '../octoUtils'
import mutator from '../mutator'

import Editable from '../widgets/editable'
import MenuWrapper from '../widgets/menuWrapper'
import Menu from '../widgets/menu'

type Props = {
    readOnly: boolean
    card: Card
    propertyTemplate: IPropertyTemplate
    emptyDisplayValue: string
}

type State = {
    value: string
}

export default class PropertyValueElement extends React.Component<Props, State> {
    private valueEditor = React.createRef<Editable>()

    constructor(props: Props) {
        super(props)
        const propertyValue = props.card.properties[props.propertyTemplate.id]
        this.state = {value: propertyValue}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): JSX.Element {
        const {card, propertyTemplate, readOnly, emptyDisplayValue} = this.props
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

            return (
                <MenuWrapper>
                    <div
                        className={`${className} ${propertyColorCssClassName}`}
                        tabIndex={0}
                    >
                        {finalDisplayValue}
                    </div>
                    {readOnly ? null : (
                        <Menu>
                            <Menu.Text
                                id=''
                                name='<Empty>'
                                onClick={() => mutator.changePropertyValue(card, propertyTemplate.id, '')}
                            />
                            {propertyTemplate.options.map((o: IPropertyOption): JSX.Element => (
                                <Menu.Text
                                    key={o.id}
                                    id={o.id}
                                    name={o.value}
                                    onClick={() => mutator.changePropertyValue(card, propertyTemplate.id, o.id)}
                                />
                            ))}
                        </Menu>
                    )}
                </MenuWrapper>
            )
        }

        if (propertyTemplate.type === 'text' || propertyTemplate.type === 'number') {
            if (!readOnly) {
                return (
                    <Editable
                        ref={this.valueEditor}
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
