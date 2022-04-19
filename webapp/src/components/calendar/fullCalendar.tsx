// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react'
import {useIntl} from 'react-intl'

import FullCalendar, {EventChangeArg, EventInput, EventContentArg, DayCellContentArg} from '@fullcalendar/react'

import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'

import mutator from '../../mutator'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import {DateProperty, createDatePropertyFromString} from '../properties/dateRange/dateRange'
import Tooltip from '../../widgets/tooltip'
import PropertyValueElement from '../propertyValueElement'
import {Constants, Permission} from '../../constants'
import {useHasCurrentBoardPermissions} from '../../hooks/permissions'
import CardBadges from '../cardBadges'

import './fullcalendar.scss'

const oneDay = 60 * 60 * 24 * 1000

type Props = {
    board: Board
    cards: Card[]
    activeView: BoardView
    readonly: boolean
    initialDate?: Date
    dateDisplayProperty?: IPropertyTemplate
    showCard: (cardId: string) => void
    addCard: (properties: Record<string, string>) => void
}

function createDatePropertyFromCalendarDates(start: Date, end: Date) : DateProperty {
    // save as noon local, expected from the date picker
    start.setHours(12)
    const dateFrom = start.getTime() - timeZoneOffset(start.getTime())
    end.setHours(12)
    const dateTo = end.getTime() - timeZoneOffset(end.getTime()) - oneDay // subtract one day. Calendar is date exclusive

    const dateProperty : DateProperty = {from: dateFrom}
    if (dateTo !== dateFrom) {
        dateProperty.to = dateTo
    }
    return dateProperty
}

function createDatePropertyFromCalendarDate(start: Date) : DateProperty {
    // save as noon local, expected from the date picker
    start.setHours(12)
    const dateFrom = start.getTime() - timeZoneOffset(start.getTime())

    const dateProperty : DateProperty = {from: dateFrom}
    return dateProperty
}

const timeZoneOffset = (date: number): number => {
    return new Date(date).getTimezoneOffset() * 60 * 1000
}

const CalendarFullView = (props: Props): JSX.Element|null => {
    const intl = useIntl()
    const {board, cards, activeView, dateDisplayProperty, readonly} = props
    const isSelectable = !readonly
    const canAddCards = useHasCurrentBoardPermissions([Permission.ManageBoardCards])

    const visiblePropertyTemplates = useMemo(() => (
        board.cardProperties.filter((template: IPropertyTemplate) => activeView.fields.visiblePropertyIds.includes(template.id))
    ), [board.cardProperties, activeView.fields.visiblePropertyIds])

    let {initialDate} = props
    if (!initialDate) {
        initialDate = new Date()
    }

    const isEditable = useCallback(() : boolean => {
        if (readonly || !dateDisplayProperty || (dateDisplayProperty.type === 'createdTime' || dateDisplayProperty.type === 'updatedTime')) {
            return false
        }
        return true
    }, [readonly, dateDisplayProperty])

    const myEventsList = useMemo(() => (
        cards.flatMap((card): EventInput[] => {
            let dateFrom = new Date(card.createAt || 0)
            let dateTo = new Date(card.createAt || 0)
            if (dateDisplayProperty && dateDisplayProperty?.type === 'updatedTime') {
                dateFrom = new Date(card.updateAt || 0)
                dateTo = new Date(card.updateAt || 0)
            } else if (dateDisplayProperty && dateDisplayProperty?.type !== 'createdTime') {
                const dateProperty = createDatePropertyFromString(card.fields.properties[dateDisplayProperty.id || ''] as string)
                if (!dateProperty.from) {
                    return []
                }

                // date properties are stored as 12 pm UTC, convert to 12 am (00) UTC for calendar
                dateFrom = dateProperty.from ? new Date(dateProperty.from + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.from))) : new Date()
                dateFrom.setHours(0, 0, 0, 0)
                const dateToNumber = dateProperty.to ? dateProperty.to + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.to)) : dateFrom.getTime()
                dateTo = new Date(dateToNumber + oneDay) // Add one day.
                dateTo.setHours(0, 0, 0, 0)
            }
            return [{
                id: card.id,
                title: card.title,
                extendedProps: {icon: card.fields.icon},
                properties: card.fields.properties,
                allDay: true,
                start: dateFrom,
                end: dateTo,
            }]
        })
    ), [cards, dateDisplayProperty])

    const visibleBadges = activeView.fields.visiblePropertyIds.includes(Constants.badgesColumnId)

    const renderEventContent = (eventProps: EventContentArg): JSX.Element|null => {
        const {event} = eventProps
        return (
            <div
                className='EventContent'
                onClick={() => props.showCard(event.id)}
            >
                <div className='octo-icontitle'>
                    { event.extendedProps.icon ? <div className='octo-icon'>{event.extendedProps.icon}</div> : undefined }
                    <div
                        className='fc-event-title'
                        key='__title'
                    >{event.title || intl.formatMessage({id: 'KanbanCard.untitled', defaultMessage: 'Untitled'})}</div>
                </div>
                {visiblePropertyTemplates.map((template) => (
                    <Tooltip
                        key={template.id}
                        title={template.name}
                    >
                        <PropertyValueElement
                            board={board}
                            readOnly={true}
                            card={cards.find((o) => o.id === event.id) || cards[0]}
                            propertyTemplate={template}
                            showEmptyPlaceholder={false}
                        />
                    </Tooltip>
                ))}
                {visibleBadges &&
                <CardBadges card={cards.find((o) => o.id === event.id) || cards[0]}/> }
            </div>
        )
    }

    const eventChange = useCallback((eventProps: EventChangeArg) => {
        const {event} = eventProps
        if (!event.start) {
            return
        }
        if (!event.end) {
            return
        }

        const startDate = new Date(event.start.getTime())
        const endDate = new Date(event.end.getTime())
        const dateProperty = createDatePropertyFromCalendarDates(startDate, endDate)
        const card = cards.find((o) => o.id === event.id)
        if (card && dateDisplayProperty) {
            mutator.changePropertyValue(board.id, card, dateDisplayProperty.id, JSON.stringify(dateProperty))
        }
    }, [cards, dateDisplayProperty])

    const onNewEvent = useCallback((args: {start: Date, end: Date}) => {
        let dateProperty: DateProperty
        if (args.start === args.end) {
            dateProperty = createDatePropertyFromCalendarDate(args.start)
        } else {
            dateProperty = createDatePropertyFromCalendarDates(args.start, args.end)
            if (dateProperty.to === undefined) {
                return
            }
        }

        const properties: Record<string, string> = {}
        if (dateDisplayProperty) {
            properties[dateDisplayProperty.id] = JSON.stringify(dateProperty)
        }

        props.addCard(properties)
    }, [props.addCard, dateDisplayProperty])

    const toolbar = useMemo(() => ({
        left: 'title',
        center: '',
        right: 'dayGridWeek dayGridMonth prev,today,next',
    }), [])

    const buttonText = useMemo(() => ({
        today: intl.formatMessage({id: 'calendar.today', defaultMessage: 'TODAY'}),
        month: intl.formatMessage({id: 'calendar.month', defaultMessage: 'Month'}),
        week: intl.formatMessage({id: 'calendar.week', defaultMessage: 'Week'}),
    }), [])

    const dayCellContent = useCallback((args: DayCellContentArg): JSX.Element|null => {
        return (
            <div className={'dateContainer ' + (canAddCards ? 'with-plus' : '')}>
                <div
                    className='addEvent'
                    onClick={() => onNewEvent({start: args.date, end: args.date})}
                >
                    {'+'}
                </div>
                <div className='dateDisplay'>
                    {args.dayNumberText}
                </div>
            </div>
        )
    }, [dateDisplayProperty, canAddCards])

    return (
        <div
            className='CalendarContainer'
        >
            <FullCalendar
                key={activeView.id}
                dayCellContent={dayCellContent}
                dayMaxEventRows={5}
                initialDate={initialDate}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView='dayGridMonth'
                events={myEventsList}
                editable={isEditable()}
                eventResizableFromStart={isEditable()}
                headerToolbar={toolbar}
                buttonText={buttonText}
                eventContent={renderEventContent}
                eventChange={eventChange}

                selectable={isSelectable}
                selectMirror={true}
                select={onNewEvent}
            />
        </div>
    )
}

export default CalendarFullView
