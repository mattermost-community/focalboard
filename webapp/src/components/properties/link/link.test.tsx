// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react'
import {render, screen} from '@testing-library/react'

import {mocked} from 'jest-mock'

import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'

import {wrapIntl} from '../../../testUtils'
import {Utils} from '../../../utils'
import {sendFlashMessage} from '../../flashMessages'

import Link from './link'

jest.mock('../../flashMessages')

const mockedCopy = jest.spyOn(Utils, 'copyTextToClipboard').mockImplementation(() => true)
const mockedSendFlashMessage = mocked(sendFlashMessage, true)

describe('components/properties/link', () => {
    beforeEach(jest.clearAllMocks)

    const linkCallbacks = {
        onChange: jest.fn(),
        onSave: jest.fn(),
        onCancel: jest.fn(),
        validator: jest.fn(() => true),
    }

    const LinkWrapper = (props: {url: string}) => {
        const [value, setValue] = useState(props.url)
        return (
            <Link
                {...linkCallbacks}
                value={value}
                onChange={(text) => setValue(text)}
            />
        )
    }

    it('should match snapshot for link with empty url', () => {
        const {container} = render(wrapIntl((
            <Link
                {...linkCallbacks}
                value=''
            />
        )))
        expect(container).toMatchSnapshot()
    })

    it('should match snapshot for link with non-empty url', () => {
        const {container} = render(wrapIntl((
            <Link
                {...linkCallbacks}
                value='https://github.com/mattermost/focalboard'
            />
        )))
        expect(container).toMatchSnapshot()
    })

    it('should match snapshot for readonly link with non-empty url', () => {
        const {container} = render(wrapIntl((
            <Link
                {...linkCallbacks}
                value='https://github.com/mattermost/focalboard'
                readonly={true}
            />
        )))
        expect(container).toMatchSnapshot()
    })

    it('should change to link after entering url', () => {
        render(wrapIntl(<LinkWrapper url=''/>))

        const url = 'https://mattermost.com'
        const input = screen.getByRole('textbox')
        userEvent.type(input, `${url}{enter}`)

        const link = screen.getByRole('link')
        expect(link).toHaveAttribute('href', url)
        expect(link).toHaveTextContent(url)
        expect(screen.getByRole('button', {name: 'Edit'})).toBeInTheDocument()
        expect(screen.getByRole('button', {name: 'Copy'})).toBeInTheDocument()
        expect(linkCallbacks.onSave).toHaveBeenCalled()
    })

    it('should allow to edit link url', () => {
        render(wrapIntl(<LinkWrapper url='https://mattermost.com'/>))

        screen.getByRole('button', {name: 'Edit'}).click()
        const newURL = 'https://github.com/mattermost'
        const input = screen.getByRole('textbox')
        userEvent.clear(input)
        userEvent.type(input, `${newURL}{enter}`)
        const link = screen.getByRole('link')
        expect(link).toHaveAttribute('href', newURL)
        expect(link).toHaveTextContent(newURL)
    })

    it('should allow to copy url', () => {
        const url = 'https://mattermost.com'
        render(wrapIntl(<LinkWrapper url={url}/>))
        screen.getByRole('button', {name: 'Copy'}).click()
        expect(mockedCopy).toHaveBeenCalledWith(url)
        expect(mockedSendFlashMessage).toHaveBeenCalledWith({content: 'Copied!', severity: 'high'})
    })
})
