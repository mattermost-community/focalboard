// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {fireEvent, render} from '@testing-library/react'

import {IntlProvider} from 'react-intl'
import {act} from 'react-dom/test-utils'

import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'

import {TestBlockFactory} from '../../test/testBlockFactory'

import {mockDOM} from '../../testUtils'

import CardDetailContents from './cardDetailContents'

const wrapProviders = (children: any) => {
    return (
        <DndProvider backend={HTML5Backend}>
            <IntlProvider locale='en'>{children}</IntlProvider>
        </DndProvider>
    )
}

global.fetch = jest.fn()

beforeAll(() => {
    mockDOM()
})

describe('components/cardDetail/cardDetailContents', () => {
    const board = TestBlockFactory.createBoard()
    board.fields.cardProperties = [
        {
            id: 'property_id_1',
            name: 'Owner',
            type: 'select',
            options: [
                {
                    color: 'propColorDefault',
                    id: 'property_value_id_1',
                    value: 'Jean-Luc Picard',
                },
                {
                    color: 'propColorDefault',
                    id: 'property_value_id_2',
                    value: 'William Riker',
                },
                {
                    color: 'propColorDefault',
                    id: 'property_value_id_3',
                    value: 'Deanna Troi',
                },
            ],
        },
    ]

    const card = TestBlockFactory.createCard(board)

    test('should match snapshot', async () => {
        const component = wrapProviders((
            <CardDetailContents
                id='test-id'
                card={card}
                contents={[]}
                readonly={false}
            />
        ))

        let container: Element | undefined
        await act(async () => {
            const result = render(component)
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with contents array', async () => {
        const contents = [TestBlockFactory.createDivider(card)]
        const component = wrapProviders((
            <CardDetailContents
                id='test-id'
                card={card}
                contents={contents}
                readonly={false}
            />
        ))

        let container: Element | undefined
        await act(async () => {
            const result = render(component)
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot after onBlur triggers', async () => {
        const component = wrapProviders((
            <CardDetailContents
                id='test-id'
                card={card}
                contents={[]}
                readonly={false}
            />
        ))

        let container: Element | undefined
        await act(async () => {
            const result = render(component)
            container = result.container
        })
        const markdownEditorField = container!.querySelector('.octo-editor-preview.octo-placeholder')
        expect(markdownEditorField).toBeDefined()
        fireEvent.click(markdownEditorField!)

        const onFocusEvent = new FocusEvent('focus', {
            view: window,
            bubbles: true,
            cancelable: true,
        })

        const onBlurEvent = new FocusEvent('blur', {
            view: window,
            bubbles: true,
            cancelable: true,
        })

        const textareaContainer = container!.querySelectorAll('.CodeMirror.cm-s-easymde.CodeMirror-wrap')
        const textarea = textareaContainer[textareaContainer.length - 1].querySelector('textarea')

        await act(async () => {
            textarea!.dispatchEvent(onFocusEvent)
            fireEvent.input(textarea!, {target: {value: 'test123'}})
            fireEvent.keyPress(textarea!, {key: 'Escape', code: 'Escape'})
            textarea!.dispatchEvent(onBlurEvent)
        })

        // TODO: Remove this hack if we get rid of codemirror/simpleMDE.
        await new Promise((r) => setTimeout(r, 100))
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot with contents array that has array inside it', async () => {
        const contents = [TestBlockFactory.createDivider(card), [TestBlockFactory.createDivider(card), TestBlockFactory.createDivider(card)]]
        const component = wrapProviders((
            <CardDetailContents
                id='test-id'
                card={card}
                contents={contents}
                readonly={false}
            />
        ))

        let container: Element | undefined
        await act(async () => {
            const result = render(component)
            container = result.container
        })
        expect(container).toMatchSnapshot()
    })

    test('should match snapshot after drag and drop event', async () => {
        const contents = [TestBlockFactory.createDivider(card), [TestBlockFactory.createDivider(card), TestBlockFactory.createDivider(card)]]
        card.fields.contentOrder = contents.map((content) => (Array.isArray(content) ? content.map((c) => c.id) : (content as any).id))
        const component = wrapProviders((
            <CardDetailContents
                id='test-id'
                card={card}
                contents={contents}
                readonly={false}
            />
        ))

        let container: Element | undefined
        await act(async () => {
            const result = render(component)
            container = result.container
        })

        const drag = container!.querySelectorAll('.dnd-handle')[0]
        const drop = container!.querySelectorAll('.addToRow')[4]

        fireEvent.dragStart(drag)
        fireEvent.dragEnter(drop)
        fireEvent.dragOver(drop)
        fireEvent.drop(drop)

        expect(container).toMatchSnapshot()
    })

    test('should match snapshot after drag and drop event 2', async () => {
        const contents = [TestBlockFactory.createDivider(card), TestBlockFactory.createDivider(card)]
        card.fields.contentOrder = contents.map((content) => (Array.isArray(content) ? content.map((c) => c.id) : (content as any).id))
        const component = wrapProviders((
            <CardDetailContents
                id='test-id'
                card={card}
                contents={contents}
                readonly={false}
            />
        ))

        let container: Element | undefined
        await act(async () => {
            const result = render(component)
            container = result.container
        })

        const drag = container!.querySelectorAll('.dnd-handle')[0]
        const drop = container!.querySelectorAll('.addToRow')[4]

        fireEvent.dragStart(drag)
        fireEvent.dragEnter(drop)
        fireEvent.dragOver(drop)
        fireEvent.drop(drop)

        expect(container).toMatchSnapshot()
    })

    test('should match snapshot after drag and drop event 3', async () => {
        const contents = [TestBlockFactory.createDivider(card), TestBlockFactory.createDivider(card)]
        card.fields.contentOrder = contents.map((content) => (Array.isArray(content) ? content.map((c) => c.id) : (content as any).id))
        const component = wrapProviders((
            <CardDetailContents
                id='test-id'
                card={card}
                contents={contents}
                readonly={false}
            />
        ))

        let container: Element | undefined
        await act(async () => {
            const result = render(component)
            container = result.container
        })

        const drag = container!.querySelectorAll('.dnd-handle')[1]
        const drop = container!.querySelectorAll('.addToRow')[2]

        fireEvent.dragStart(drag)
        fireEvent.dragEnter(drop)
        fireEvent.dragOver(drop)
        fireEvent.drop(drop)

        expect(container).toMatchSnapshot()
    })
})
