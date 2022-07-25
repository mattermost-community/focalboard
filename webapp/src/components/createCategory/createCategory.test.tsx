// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {render} from "@testing-library/react"

import userEvent from "@testing-library/user-event"

import {wrapIntl} from "../../testUtils"

import CreateCategory from "./createCategory"

describe('components/createCategory/CreateCategory', () => {
    it('base case should match snapshot', () => {
        const component = wrapIntl(
            <CreateCategory
                onClose={jest.fn()}
                onCreate={jest.fn()}
                title={
                    <span>{'title'}</span>
                }
            />
        )

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    it('should call onClose on being closed', () => {
        const onCloseHandler = jest.fn()
        const component = wrapIntl(
            <CreateCategory
                onClose={onCloseHandler}
                onCreate={jest.fn()}
                title={
                    <span>{'title'}</span>
                }
            />
        )

        const {container} = render(component)
        const cancelBtn = container.querySelector('.createCategoryActions > .Button.danger')
        expect(cancelBtn).toBeTruthy()
        userEvent.click(cancelBtn as Element)
        expect(onCloseHandler).toBeCalledTimes(1)

        const closeBtn = container.querySelector('.toolbar > .IconButton')
        expect(closeBtn).toBeTruthy()
        userEvent.click(closeBtn as Element)
        expect(onCloseHandler).toBeCalledTimes(2)
    })

    it('should call onCreate on pressing enter', () => {
        const onCreateHandler = jest.fn()
        const component = wrapIntl(
            <CreateCategory
                onClose={jest.fn()}
                onCreate={onCreateHandler}
                title={
                    <span>{'title'}</span>
                }
            />
        )

        const {container} = render(component)
        const inputField = container.querySelector('.categoryNameInput')
        expect(inputField).toBeTruthy()
        userEvent.type(inputField as Element, 'category name{enter}')
        expect(onCreateHandler).toBeCalledWith('category name')
    })

    it('should show initial value', () => {
        const onCreateHandler = jest.fn()
        const component = wrapIntl(
            <CreateCategory
                initialValue='Dwight prank ideas'
                onClose={jest.fn()}
                onCreate={onCreateHandler}
                title={
                    <span>{'title'}</span>
                }
            />
        )

        const {container} = render(component)
        const inputField = container.querySelector('.categoryNameInput')
        expect(inputField).toBeTruthy()
        expect((inputField as HTMLInputElement).value).toBe('Dwight prank ideas')
    })

    it('should clear input field on clicking clear icon', () => {
        const onCreateHandler = jest.fn()
        const component = wrapIntl(
            <CreateCategory
                initialValue='Dunder Mifflin'
                onClose={jest.fn()}
                onCreate={onCreateHandler}
                title={
                    <span>{'title'}</span>
                }
            />
        )

        const {container} = render(component)
        const inputField = container.querySelector('.categoryNameInput')
        expect(inputField).toBeTruthy()
        expect((inputField as HTMLInputElement).value).toBe('Dunder Mifflin')

        const clearBtn = container.querySelector('.clearBtn')
        expect(clearBtn).toBeTruthy()
        userEvent.click(clearBtn as Element)
        expect((inputField as HTMLInputElement).value).toBe('')
    })
})
