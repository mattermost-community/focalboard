// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {useIntl} from 'react-intl'

import FullCalendar, {EventClickArg, EventChangeArg, EventInput, EventContentArg} from '@fullcalendar/react'

import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'

// import timeGridPlugin from '@fullcalendar/timegrid'
// import listPlugin from '@fullcalendar/list'

import mutator from '../../mutator'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import {DateProperty, createDatePropertyFromString} from '../properties/dateRange/dateRange'

import './fullcalendar.scss'

type Props = {
    board: Board
    activeView: BoardView
    cards: Card[]

    dateDisplayProperty?: IPropertyTemplate
    showCard: (cardId: string) => void
    addCard: (properties: Record<string, string>) => void
}

function createDatePropertyFromCalendarDates(start: Date, end: Date, timeZoneOffset: number) : DateProperty {
    // save as noon
    start.setHours(12)
    const dateFrom = start.getTime() - timeZoneOffset
    end.setHours(12)
    const dateTo = end.getTime() - timeZoneOffset - (60 * 60 * 24 * 1000) // subtract one day. Calendar is date exclusive

    const dateProperty : DateProperty = {from: dateFrom}
    if (dateTo !== dateFrom) {
        dateProperty.to = dateTo
    }
    return dateProperty
}

const CalendarFullView = (props: Props): JSX.Element|null => {
    const intl = useIntl()
    const {cards, board, activeView} = props
    const timeZoneOffset = new Date().getTimezoneOffset() * 60 * 1000

    let dateDisplayProperty = props.dateDisplayProperty

    if (!dateDisplayProperty) {
        // Find first date property
        // TODO: Should we look for CreateAt, ModifyAt. Must be a defined property to set.
        // Otherwise don't set and just use createAt below.
        dateDisplayProperty = board.fields.cardProperties.find((o: IPropertyTemplate) => o.type === 'date')
        if (dateDisplayProperty) {
            mutator.changeViewDateDisplayPropertyId(activeView.id, activeView.fields.dateDisplayPropertyId, dateDisplayProperty.id)
        }
    }

    const myEventsList = props.cards.flatMap((card): EventInput[] => {
        if (dateDisplayProperty && dateDisplayProperty?.type !== 'createdTime') {
            const dateProperty = createDatePropertyFromString(card.fields.properties[dateDisplayProperty.id || ''] as string)
            if (!dateProperty.from) {
                return []
            }

            // console.log(dateProperty)
            // date properties are stored as 12 pm UTC, convert to 12 am (00) UTC for calendar
            const dateFrom = dateProperty.from ? new Date(dateProperty.from + (dateProperty.includeTime ? 0 : timeZoneOffset)) : new Date()
            dateFrom.setHours(0)
            const dateToNumber = dateProperty.to ? dateProperty.to + (dateProperty.includeTime ? 0 : timeZoneOffset) : dateFrom.getTime()
            const dateTo = new Date(dateToNumber + (60 * 60 * 24 * 1000)) // Add one day.+ (60 * 60 * 24 * 1000)
            dateTo.setHours(0, 0, 0, 0)

            // dateTo.setTime(dateTo.getTime() - 1000)

            return [{
                id: card.id,
                title: card.title,
                extendedProps: {icon: card.fields.icon},
                properties: card.fields.properties,

                allDay: true,
                start: dateFrom,
                end: dateTo,
            }]
        }
        return [{
            id: card.id,
            title: card.title,
            extendedProps: [{icon: card.fields.icon}],
            properties: card.fields.properties,

            allDay: true,
            start: new Date(card.createAt || 0),
            end: new Date(card.createAt || 0),
        }]
    })

    const renderEventContent = (eventProps: EventContentArg): JSX.Element|null => {
        const {event} = eventProps
        return (
            <div className='octo-icontitle'>
                { event.extendedProps.icon ? <div className='octo-icon'>{event.extendedProps.icon}</div> : undefined }
                <div
                    className='fc-event-title'
                    key='__title'
                >{event.title || intl.formatMessage({id: 'KanbanCard.untitled', defaultMessage: 'Untitled'})}</div>
            </div>
        )
    }

    const eventClick = (eventProps: EventClickArg) => {
        const {event} = eventProps
        props.showCard(event.id)
    }

    const eventChange = (eventProps: EventChangeArg) => {
        const {event} = eventProps
        if (!event.start) {
            return
        }
        if (!event.end) {
            return
        }

        const startDate = new Date(event.start.getTime())
        const endDate = new Date(event.end.getTime())
        const dateProperty = createDatePropertyFromCalendarDates(startDate, endDate, timeZoneOffset)
        const card = cards.find((o) => o.id === event.id)
        if (card && dateDisplayProperty) {
            mutator.changePropertyValue(card, dateDisplayProperty.id, JSON.stringify(dateProperty))
        }
    }

    const toolbar = {
        left: 'title',
        center: '',
        right: 'dayGridWeek dayGridMonth prev,today,next',
    }

    const buttonText = {
        today: intl.formatMessage({id: 'calendar.today', defaultMessage: 'TODAY'}),
        month: intl.formatMessage({id: 'calendar.month', defaultMessage: 'Month'}),
        week: intl.formatMessage({id: 'calendar.week', defaultMessage: 'Week'}),
    }

    return (
        <div
            className='CalendarContainer'
        >
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView='dayGridMonth'
                events={myEventsList}
                editable={true}
                headerToolbar={toolbar}
                buttonText={buttonText}
                eventClick={eventClick}
                eventContent={renderEventContent}
                eventChange={eventChange}
            />
        </div>
    )
}

export default CalendarFullView
