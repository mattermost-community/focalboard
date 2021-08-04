// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {Calendar, momentLocalizer} from 'react-big-calendar'
import moment from 'moment'

const localizer = momentLocalizer(moment)

const CalendarView = (): JSX.Element => {
    return (
        <div>
            <Calendar
                localizer={localizer}
            />
        </div>
    )
}

export default CalendarView
