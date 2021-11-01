// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {DragEvent, ComponentType, useState, useLayoutEffect, useRef} from 'react'
import {useIntl} from 'react-intl'

import {Calendar, CalendarProps, momentLocalizer, SlotInfo} from 'react-big-calendar'

import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'

import moment, {now} from 'moment'

import mutator from '../../mutator'

import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import {DateProperty, createDatePropertyFromString} from '../properties/dateRange/dateRange'

import CustomToolbar from './toolbar'

import './calendar.scss'
class CalendarResource {
    title: string
    id: string

    constructor(id: string, title: string) {
        this.id = id
        this.title = title
    }
}

class CalendarEvent {
    id: string
    title: string
    icon: string
    properties: Record<string, string | string[]>
    start: Date
    end: Date

    constructor(_id: string, _title: string, _icon: string, _properties: Record<string, string | string[]>, _start: Date, _endDate: Date) {
        this.id = _id
        this.title = _title
        this.icon = _icon
        this.properties = _properties
        this.start = _start
        this.end = _endDate
    }
}

const DragAndDropCalendar = withDragAndDrop<CalendarEvent, CalendarResource>(Calendar as ComponentType<CalendarProps<CalendarEvent, CalendarResource>>)
const localizer = momentLocalizer(moment) // or globalizeLocalizer

type Props = {
    board: Board
    activeView: BoardView
    cards: Card[]

    dateDisplayProperty?: IPropertyTemplate
    showCard: (cardId: string) => void
    addCard: (properties: Record<string, string>) => void

    // cardTree: CardTree
    // readonly: boolean
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

    console.log('createDateProperty')
    console.log(new Date(dateFrom))
    console.log(new Date(dateTo))
    return dateProperty
}

const CalendarView = (props: Props): JSX.Element|null => {
    const intl = useIntl()
    const calendarRef = useRef<HTMLDivElement>(null)
    const {cards, board, activeView} = props
    const timeZoneOffset = new Date().getTimezoneOffset() * 60 * 1000
    const [dragEvent, setDragEvent] = useState<CalendarEvent>()

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

    const myEventsList = props.cards.flatMap((card) => {
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
            dateTo.setTime(dateTo.getTime() - 1000)

            return [{
                id: card.id,
                title: card.title,
                icon: card.fields.icon || '',
                properties: card.fields.properties,

                allDay: true,
                start: dateFrom,
                end: dateTo,
            }]
        }
        return [{
            id: card.id,
            title: card.title,
            icon: card.fields.icon || '',
            properties: card.fields.properties,

            allDay: true,
            start: new Date(card.createAt || 0),
            end: new Date(card.createAt || 0),
        }]
    })

    const onNewEvent = (slots: SlotInfo) => {
        console.log('onNewEvent')
        console.log(slots)

        const startDate = new Date(slots.start)
        const endDate = new Date(slots.end)
        const dateProperty = createDatePropertyFromCalendarDates(startDate, endDate, timeZoneOffset)

        const properties: Record<string, string> = {}
        if (dateDisplayProperty) {
            properties[dateDisplayProperty.id] = JSON.stringify(dateProperty)
        }

        props.addCard(properties)
    }

    const onSelectCard = (event: CalendarEvent) => {
        console.log('onSelectCard')

        props.showCard(event.id)
    }

    const onEventResize = (args: any) => {
        console.log('onEventResize')

        const startDate = new Date(args.start.getTime())
        const endDate = new Date(args.end.getTime())
        const dateProperty = createDatePropertyFromCalendarDates(startDate, endDate, timeZoneOffset)

        const card = cards.find((o) => o.id === args.event.id)
        if (card && dateDisplayProperty) {
            mutator.changePropertyValue(card, dateDisplayProperty.id, JSON.stringify(dateProperty))
        }
    }

    const onEventDrop = (args: {event: CalendarEvent, start: Date|string, end: Date|string, isAllDay: boolean}) => {
        console.log('onEventDrop')
        const startDate = new Date(args.start)
        const endDate = new Date(args.end)
        const dateProperty = createDatePropertyFromCalendarDates(startDate, endDate, timeZoneOffset)

        const card = cards.find((o) => o.id === args.event.id)
        if (card && dateDisplayProperty) {
            mutator.changePropertyValue(card, dateDisplayProperty.id, JSON.stringify(dateProperty))
        }
    }

    const handleDragStart = (event: CalendarEvent) => {
        console.log('handleDragStart')

        setDragEvent(event)
    }

    const CustomEvent = (event: any) => {
        return (
            <div className='octo-icontitle'>
                { event.event.icon ? <div className='octo-icon'>{event.event.icon}</div> : undefined }
                <div key='__title'>{event.title || intl.formatMessage({id: 'KanbanCard.untitled', defaultMessage: 'Untitled'})}</div>
            </div>
        )
    }

    const onDragOver = (event: DragEvent) => {
        console.log('onDragOver')

        if (dragEvent) {
            console.log(dragEvent)
            event.preventDefault()
        }
    }

    const onDragStart = (event: any) => {
        console.log('onDragStart')
        console.log(event)
    }

    const onDropFromOutside = (args: {start: Date|string, end: Date|string, allDay: boolean}) => {
        console.log('onDropFromOutside')

        const startDate = new Date(args.start)
        const endDate = new Date(args.end)
        if (dragEvent) {
            const card = cards.find((o) => o.id === dragEvent.id)

            if (card && dateDisplayProperty) {
                const originalDate = createDatePropertyFromString(card.fields.properties[dateDisplayProperty.id || ''] as string)

                const dateFrom = startDate.getTime() - timeZoneOffset
                const range : DateProperty = {from: dateFrom}
                if (originalDate.to && originalDate.from !== originalDate.to) {
                    range.to = endDate.getTime() - timeZoneOffset
                }
                mutator.changePropertyValue(card, dateDisplayProperty.id, JSON.stringify(range))
            }
            setDragEvent(undefined)
        }
    }

    return (
        <div
            className='CalendarContainer'
            ref={calendarRef}

            // onKeyPress={onKeyDown}
        >
            <DragAndDropCalendar

                selectable={true}

                // defaultDate={new Date(Date.now() - (1000 * 60 * 60 * 24 * 30))}
                popup={true}
                className='DragAndDropCalendar'
                localizer={localizer}
                events={myEventsList}
                views={['week', 'month']}

                components={{
                    toolbar: CustomToolbar,
                    event: CustomEvent,
                }}
                onSelectSlot={onNewEvent}
                onSelectEvent={(event) => onSelectCard(event)}
                onEventDrop={onEventDrop}
                onEventResize={onEventResize}
                handleDragStart={handleDragStart}
                onDropFromOutside={onDropFromOutside}
                onDragOver={onDragOver}
                onDragStart={onDragStart}
            />
        </div>
    )
}

export default CalendarView
