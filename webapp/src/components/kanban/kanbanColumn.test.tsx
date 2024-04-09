// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {render} from '@testing-library/react'
import React from 'react'

import {wrapDNDIntl} from '../../testUtils'

import KanbanColumn from './kanbanColumn'
describe('src/components/kanban/kanbanColumn', () => {
    test('should match snapshot', () => {
        const {container} = render(wrapDNDIntl(
            <KanbanColumn
                columnId='1'
                setDraggedOverColumnId={() => {}}
                activeDragColumnId="dummyColumnId" 
            >
                {}
            </KanbanColumn>,
        ))
        expect(container).toMatchSnapshot()
    })
})

