// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import 'isomorphic-fetch'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'

import {IPropertyTemplate, IPropertyOption} from '../blocks/board'

import {TestBlockFactory} from '../test/testBlockFactory'

import PropertyValueElement from './propertyValueElement'

const wrapProviders = (children: any) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <IntlProvider locale='en'>{children}</IntlProvider>
        </DndProvider>
    )
}

describe('components/propertyValueElement', () => {
    const board = TestBlockFactory.createBoard()
    const card = TestBlockFactory.createCard(board)
    const comments = TestBlockFactory.createComment(card)

    test('should match snapshot, select', async () => {
        const propertyTemplate = board.fields.cardProperties.find((p) => p.id === 'property1')
        const component = wrapProviders(
            <PropertyValueElement
                board={board}
                readOnly={false}
                card={card}
                contents={[]}
                comments={[comments]}
                propertyTemplate={propertyTemplate || board.fields.cardProperties[0]}
                showEmptyPlaceholder={true}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, select, read-only', async () => {
        const propertyTemplate = board.fields.cardProperties.find((p) => p.id === 'property1')
        const component = wrapProviders(
            <PropertyValueElement
                board={board}
                readOnly={true}
                card={card}
                contents={[]}
                comments={[comments]}
                propertyTemplate={propertyTemplate || board.fields.cardProperties[0]}
                showEmptyPlaceholder={true}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, multi-select', () => {
        const options: IPropertyOption[] = []
        for (let i = 0; i < 3; i++) {
            const propertyOption: IPropertyOption = {
                id: `ms${i}`,
                value: `value ${i}`,
                color: 'propColorBrown',
            }
            options.push(propertyOption)
        }

        const propertyTemplate: IPropertyTemplate = {
            id: 'multiSelect',
            name: 'MultiSelect',
            type: 'multiSelect',
            options,
        }
        card.fields.properties.multiSelect = ['ms1', 'ms2']
        const component = wrapProviders(
            <PropertyValueElement
                board={board}
                readOnly={false}
                card={card}
                contents={[]}
                comments={[comments]}
                propertyTemplate={propertyTemplate}
                showEmptyPlaceholder={true}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, url, array value', () => {
        const propertyTemplate: IPropertyTemplate = {
            id: 'property_url',
            name: 'Property URL',
            type: 'url',
            options: [],
        }
        card.fields.properties.property_url = ['http://localhost']

        const component = wrapProviders(
            <PropertyValueElement
                board={board}
                readOnly={false}
                card={card}
                contents={[]}
                comments={[comments]}
                propertyTemplate={propertyTemplate}
                showEmptyPlaceholder={true}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, url, array value', () => {
        const propertyTemplate: IPropertyTemplate = {
            id: 'property_url',
            name: 'Property URL',
            type: 'url',
            options: [],
        }
        card.fields.properties.property_url = ['http://localhost']

        const component = wrapProviders(
            <PropertyValueElement
                board={board}
                readOnly={false}
                card={card}
                contents={[]}
                comments={[comments]}
                propertyTemplate={propertyTemplate}
                showEmptyPlaceholder={true}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, person, array value', () => {
        const propertyTemplate: IPropertyTemplate = {
            id: 'text',
            name: 'Generic Text',
            type: 'text',
            options: [],
        }
        card.fields.properties.person = ['value1', 'value2']

        const component = wrapProviders(
            <PropertyValueElement
                board={board}
                readOnly={false}
                card={card}
                contents={[]}
                comments={[comments]}
                propertyTemplate={propertyTemplate}
                showEmptyPlaceholder={true}
            />,
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot, date, array value', () => {
        const propertyTemplate: IPropertyTemplate = {
            id: 'date',
            name: 'Date',
            type: 'date',
            options: [],
        }
        card.fields.properties.date = ['invalid date']

        const component = wrapProviders(
            <PropertyValueElement
                board={board}
                readOnly={false}
                card={card}
                contents={[]}
                comments={[comments]}
                propertyTemplate={propertyTemplate}
                showEmptyPlaceholder={true}
            />,
        )
        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
