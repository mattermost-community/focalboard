// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'

import {wrapIntl} from '../../testUtils'

import AdminBadge from './adminBadge'

describe('widgets/adminBadge', () => {
    test('should match the snapshot on TeamAdmin', () => {
        const {container} = render(wrapIntl(<AdminBadge permissions={['manage_team']}/>))
        expect(container).toMatchSnapshot()
    })

    test('should match the snapshot on Admin', () => {
        const {container} = render(wrapIntl(<AdminBadge permissions={['manage_team', 'manage_system']}/>))
        expect(container).toMatchSnapshot()
    })

    test('should match the snapshot on hide', () => {
        const {container} = render(wrapIntl(<AdminBadge permissions={[]}/>))
        expect(container).toMatchInlineSnapshot('<div />')
    })
})
