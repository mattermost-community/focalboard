// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'
import {IntlProvider} from 'react-intl'

import PropertyMenu from './propertyMenu'

describe('widgets/PropertyMenu', () => {
    beforeEach(() => {
        // Quick fix to disregard console error when unmounting a component
        console.error = jest.fn()
        document.execCommand = jest.fn()
    })

    test('should display the type of property', () => {
        const rootPortalDiv = document.createElement('div')
        rootPortalDiv.id = 'root-portal'
        const callback = jest.fn()

        const {getByText} = render(
            <IntlProvider locale='en'>
                <PropertyMenu
                    propertyId={'id'}
                    propertyName={'email of a person'}
                    propertyType={'email'}
                    onTypeChanged={callback}
                    onNameChanged={callback}
                    onDelete={callback}
                />
            </IntlProvider>,
            {container: document.body.appendChild(rootPortalDiv)},
        )

        expect(getByText('Type: Email')).toBeVisible()
    })
})
