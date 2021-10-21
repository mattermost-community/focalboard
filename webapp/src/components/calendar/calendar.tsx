// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {DragEvent, ComponentType, useState} from 'react'

import {Calendar, CalendarProps, momentLocalizer} from 'react-big-calendar'

import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'

import moment from 'moment'

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
    properties: Record<string, string | string[]>
    start: Date
    end: Date

    constructor(_id: string, _title: string, _properties: Record<string, string | string[]>, _start: Date, _endDate: Date) {
        this.id = _id
        this.title = _title
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
    addCard: () => void

    // cardTree: CardTree
    // readonly: boolean
}

const CalendarView = (props: Props): JSX.Element|null => {
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

    // const dateDisplayPropertyID = dateDisplayProperty?.id

    const myEventsList = props.cards.flatMap((card) => {
        if (dateDisplayProperty && dateDisplayProperty?.type !== 'createdTime') {
            const dateProperty = createDatePropertyFromString(card.fields.properties[dateDisplayProperty.id || ''] as string)
            if (!dateProperty.from) {
                return []
            }
            const dateFrom = dateProperty.from ? new Date(dateProperty.from + (dateProperty.includeTime ? 0 : timeZoneOffset)) : new Date()
            const dateToNumber = dateProperty.to ? dateProperty.to + (dateProperty.includeTime ? 0 : timeZoneOffset) : dateFrom.getTime()
            const dateTo = new Date(dateToNumber + (60 * 60 * 24 * 1000)) // Add one day.

            return [{
                id: card.id,
                title: card.title,
                properties: card.fields.properties,

                allDay: true,
                start: dateFrom,
                end: dateTo,
            }]
        }
        return [{
            id: card.id,
            title: card.title,
            properties: card.fields.properties,

            allDay: true,
            start: new Date(card.createAt || 0),
            end: new Date(card.createAt || 0),
        }]
    })

    const onNewEvent = () => {
        props.addCard()
    }

    const onSelectCard = (event: CalendarEvent) => {
        props.showCard(event.id)
    }

    const onEventResize = (args: any) => {
        const card = cards.find((o) => o.id === args.event.id)
        const dateFrom = args.start.getTime() - timeZoneOffset
        const dateTo = args.end.getTime() - timeZoneOffset - (60 * 60 * 24 * 1000) // subtract one day. Calendar is date exclusive

        const range : DateProperty = {from: dateFrom}
        if (dateTo !== dateFrom) {
            range.to = dateTo
        }

        if (card && dateDisplayProperty) {
            mutator.changePropertyValue(card, dateDisplayProperty.id, JSON.stringify(range))
        }
    }

    const onEventDrop = (args: {event: CalendarEvent, start: Date|string, end: Date|string, isAllDay: boolean}) => {
        const startDate = new Date(args.start)
        const endDate = new Date(args.end)

        const card = cards.find((o) => o.id === args.event.id)

        const dateFrom = startDate.getTime() - timeZoneOffset
        const dateTo = endDate.getTime() - timeZoneOffset - (60 * 60 * 24 * 1000) // subtract one day. Calendar is date exclusive

        const range : DateProperty = {from: dateFrom}
        if (dateTo !== dateFrom) {
            range.to = dateTo
        }

        if (card && dateDisplayProperty) {
            mutator.changePropertyValue(card, dateDisplayProperty.id, JSON.stringify(range))
        }
    }

    const handleDragStart = (event: CalendarEvent) => {
        setDragEvent(event)
    }

    const onDragOver = (event: DragEvent) => {
        // if (dragEvent) {
        event.preventDefault()
        // }
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

            // onKeyPress={onKeyDown}
        >
            <DragAndDropCalendar
                selectable={true}
                popup={true}
                className='DragAndDropCalendar'
                localizer={localizer}
                events={myEventsList}
                views={['week', 'month']}

                components={{
                    toolbar: CustomToolbar,
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
