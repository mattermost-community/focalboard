// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import {render} from '@testing-library/react'

import CheckIcon from '../../../widgets/icons/check'
import ClockOutline from '../../../widgets/icons/clockOutline'
import {wrapIntl, wrapRBDNDContext} from '../../../testUtils'

import BlackCheckboxOutline from '../../../widgets/icons/blackCheckboxOutline'

import EditStatusPropertyDialog, {StatusCategory} from './editStatusDialog'

describe('components/standardProperties/statusProperty/EditStatusPropertyDialog', () => {
    test('should match snapshot', () => {
        const initialValueCategoryValue: StatusCategory[] = [
            {
                id: 'category_id_1',
                title: 'Not Started',
                options: [
                    {id: 'status_id_1', value: 'Pending Design', color: 'propColorPurple'},
                    {id: 'status_id_2', value: 'TODO', color: 'propColorYellow'},
                    {id: 'status_id_3', value: 'Pending Specs', color: 'propColorGray'},
                ],
                emptyState: {
                    icon: (<BlackCheckboxOutline/>),
                    color: '--sys-dnd-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.todo.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses “Not Started”',
                    },
                },
            },
            {
                id: 'category_id_2',
                title: 'In progress',
                options: [
                    {id: 'status_id_4', value: 'In Progress', color: 'propColorBrown'},
                    {id: 'status_id_5', value: 'In Review', color: 'propColorRed'},
                    {id: 'status_id_6', value: 'In QA', color: 'propColorPink'},
                    {id: 'status_id_7', value: 'Awaiting Cherrypick', color: 'propColorOrange'},
                ],
                emptyState: {
                    icon: (<ClockOutline/>),
                    color: '--away-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.inProgress.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses “in progress”',
                    },
                },
            },
            {
                id: 'category_id_3',
                title: 'Completed',
                options: [
                    {id: 'status_id_20', value: 'Done', color: 'propColorPink'},
                    {id: 'status_id_21', value: 'Branch Cut', color: 'propColorGreen'},
                    {id: 'status_id_22', value: 'Released', color: 'propColorDefault'},
                ],
                emptyState: {
                    icon: (<CheckIcon/>),
                    color: '--online-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.complete.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses ”Done”',
                    },
                },
            },
        ]

        const component = wrapRBDNDContext(
            wrapIntl(
                <EditStatusPropertyDialog
                    valueCategories={initialValueCategoryValue}
                    onClose={() => {}}
                    onUpdate={() => {}}
                />,
            ))

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('no value in any column', () => {
        const noValueConfig: StatusCategory[] = [
            {
                id: 'category_id_1',
                title: 'Not Started',
                options: [],
                emptyState: {
                    icon: (<BlackCheckboxOutline/>),
                    color: '--sys-dnd-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.todo.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses “Not Started”',
                    },
                },
            },
            {
                id: 'category_id_2',
                title: 'In progress',
                options: [],
                emptyState: {
                    icon: (<ClockOutline/>),
                    color: '--away-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.inProgress.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses “in progress”',
                    },
                },
            },
            {
                id: 'category_id_3',
                title: 'Completed',
                options: [],
                emptyState: {
                    icon: (<CheckIcon/>),
                    color: '--online-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.complete.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses ”Done”',
                    },
                },
            },
        ]

        const component = wrapRBDNDContext(
            wrapIntl(
                <EditStatusPropertyDialog
                    valueCategories={noValueConfig}
                    onClose={() => {}}
                    onUpdate={() => {}}
                />,
            ))

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('5 columns', () => {
        const initialValueCategoryValue: StatusCategory[] = [
            {
                id: 'category_id_1',
                title: 'Column 1',
                options: [
                    {id: 'status_id_1', value: 'Pending Design', color: 'propColorPurple'},
                    {id: 'status_id_2', value: 'TODO', color: 'propColorYellow'},
                    {id: 'status_id_3', value: 'Pending Specs', color: 'propColorGray'},
                ],
                emptyState: {
                    icon: (<BlackCheckboxOutline/>),
                    color: '--sys-dnd-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.todo.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses “Not Started”',
                    },
                },
            },
            {
                id: 'category_id_2',
                title: 'Column 2',
                options: [
                    {id: 'status_id_4', value: 'In Progress', color: 'propColorBrown'},
                    {id: 'status_id_5', value: 'In Review', color: 'propColorRed'},
                    {id: 'status_id_6', value: 'In QA', color: 'propColorPink'},
                    {id: 'status_id_7', value: 'Awaiting Cherrypick', color: 'propColorOrange'},
                ],
                emptyState: {
                    icon: (<ClockOutline/>),
                    color: '--away-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.inProgress.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses “in progress”',
                    },
                },
            },
            {
                id: 'category_id_3',
                title: 'Column 3',
                options: [
                    {id: 'status_id_20', value: 'Done', color: 'propColorPink'},
                    {id: 'status_id_21', value: 'Branch Cut', color: 'propColorGreen'},
                    {id: 'status_id_22', value: 'Released', color: 'propColorDefault'},
                ],
                emptyState: {
                    icon: (<CheckIcon/>),
                    color: '--online-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.complete.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses ”Done”',
                    },
                },
            },
            {
                id: 'category_id_2',
                title: 'Column 4',
                options: [
                    {id: 'status_id_54', value: 'Michael Scott', color: 'propColorOrange'},
                ],
                emptyState: {
                    icon: (<ClockOutline/>),
                    color: '--away-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.inProgress.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses “in progress”',
                    },
                },
            },
            {
                id: 'category_id_3',
                title: 'Column 5',
                options: [
                    {id: 'status_id_22', value: 'Jim Halpert', color: 'propColorDefault'},
                ],
                emptyState: {
                    icon: (<CheckIcon/>),
                    color: '--online-indicator-rgb',
                    text: {
                        id: 'statusProperty.configDialog.complete.emptyText',
                        defaultMessage: 'Drag statuses here to consider tasks with these statuses ”Done”',
                    },
                },
            },
        ]

        const component = wrapRBDNDContext(
            wrapIntl(
                <EditStatusPropertyDialog
                    valueCategories={initialValueCategoryValue}
                    onClose={() => {}}
                    onUpdate={() => {}}
                />,
            ))

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })

    test('0 columns', () => {
        const initialValueCategoryValue: StatusCategory[] = []

        const component = wrapRBDNDContext(
            wrapIntl(
                <EditStatusPropertyDialog
                    valueCategories={initialValueCategoryValue}
                    onClose={() => {}}
                    onUpdate={() => {}}
                />,
            ))

        const {container} = render(component)
        expect(container).toMatchSnapshot()
    })
})
