// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ComponentProps} from 'react'
import {render, screen} from '@testing-library/react'
import {mocked} from 'jest-mock'

import userEvent from '@testing-library/user-event'

import {wrapIntl} from '../../testUtils'
import {TestBlockFactory} from '../../test/testBlockFactory'
import mutator from '../../mutator'

import {Board, IPropertyTemplate} from '../..//blocks/board'
import {Card} from '../../blocks/card'

import NumberProperty from './property'
import NumberEditor from './number'

jest.mock('../../components/flashMessages')
jest.mock('../../mutator')

const mockedMutator = mocked(mutator)

describe('properties/number', () => {
    let board: Board
    let card: Card
    let propertyTemplate: IPropertyTemplate
    let baseProps: ComponentProps<typeof NumberEditor>

    beforeEach(() => {
        board = TestBlockFactory.createBoard()
        card = TestBlockFactory.createCard()
        propertyTemplate = board.cardProperties[0]

        baseProps = {
            property: new NumberProperty(),
            card,
            board,
            propertyTemplate,
            propertyValue: '',
            readOnly: false,
            showEmptyPlaceholder: false,
        }
    })

    it('should match snapshot for number with empty value', () => {
        const {container} = render(
            wrapIntl((
                <NumberEditor
                    {...baseProps}
                />
            )),
        )
        expect(container).toMatchSnapshot()
    })

    it('should fire change event when valid number value is entered', async () => {
        render(
            wrapIntl(
                <NumberEditor
                    {...baseProps}
                />,
            ),
        )
        const value = '42'
        const input = screen.getByRole('textbox')
        userEvent.type(input, `${value}{Enter}`)

        expect(mockedMutator.changePropertyValue).toHaveBeenCalledWith(board.id, card, propertyTemplate.id, `${value}`)
    })
})
