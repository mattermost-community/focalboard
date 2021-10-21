// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import * as React from 'react'
import clsx from 'clsx'
import {ToolbarProps, View, NavigateAction} from 'react-big-calendar'

// export interface ICustomToolbarProps {
//     view: string;
//     views: string[];
//     label: string;
//     localizer: Localizer;
//     onNavigate: (action: any) => void;
//     onView: (view: any) => void;
// }

// export const navigateContants = {
//     PREVIOUS: 'PREV',
//     NEXT: 'NEXT',
//     TODAY: 'TODAY',
//     DATE: 'DATE',
// }

// export const views = {
//     MONTH: 'month',
//     WEEK: 'week',
//     WORK_WEEK: 'work_week',
//     DAY: 'day',
//     AGENDA: 'agenda',
// }

const CustomToolbar = (props: ToolbarProps): JSX.Element|null => {
    const {localizer: {messages}} = props

    function navigate(action: NavigateAction) {
        props.onNavigate(action)
    }

    function viewItem(view: View) {
        props.onView(view)
    }

    function viewNamesGroup() {
        const viewNames = props.views as Array<View>
        const view = props.view

        // console.log(viewNames)

        if (viewNames.length > 1) {
            return viewNames.map((name: View) => (
                <button
                    type='button'
                    key={name}
                    className={clsx('rbc-btn-view', {'rbc-active': view === name})}
                    onClick={viewItem.bind(null, name)}
                >
                    {messages[name]}
                </button>
            ))
        }
        return undefined
    }

    return (
        <div className='rbc-toolbar'>
            <span className='rbc-toolbar-label'>{props.label}</span>

            <span className='rbc-btn-group'>{viewNamesGroup()}</span>

            <span className='rbc-btn-group'>
                <button
                    type='button'
                    onClick={navigate.bind(null, 'PREV')}
                >
                    {'<'}
                </button>
                <button
                    type='button'
                    onClick={navigate.bind(null, 'TODAY')}
                >
                    {messages.today}
                </button>
                <button
                    type='button'

                    onClick={navigate.bind(null, 'NEXT')}
                >
                    {'>'}
                </button>
            </span>
        </div>
    )
}

export default CustomToolbar
