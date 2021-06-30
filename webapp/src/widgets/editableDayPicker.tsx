// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect, useRef} from 'react'
import {useIntl} from 'react-intl'
import DayPicker, {DateUtils} from 'react-day-picker'
import MomentLocaleUtils from 'react-day-picker/moment'

import Editable from '../widgets/editable'
import SwitchOption from '../widgets/menu/switchOption'
import Button from '../widgets/buttons/button'

import Modal from '../components/modal'
import ModalWrapper from '../components/modalWrapper'

import 'react-day-picker/lib/style.css'
import './editableDayPicker.scss'
import {Utils} from '../utils'

type Props = {
    className: string
    value: string | string[]
    onChange: (value: string | string[]) => void
}

const loadedLocales: Record<string, any> = {}

function EditableDayPicker(props: Props): JSX.Element {
    const {className, value, onChange} = props
    const intl = useIntl()

    const getDisplayDate = (date: Date | null | undefined) => {
        let displayDate = ''
        if (date) {
            displayDate = Utils.displayDate(date, intl)
        }
        return displayDate
    }

    const createRangeFromValue = (initialValue: string | string[]) => {
        if (!initialValue) {
            return {
                from: undefined,
                to: undefined,
            }
        } else if (Array.isArray(initialValue)) {
            return {
                from: new Date(Number(value[0])),
                to: new Date(Number(value[1])),
            }
        }
        return {
            from: new Date(Number(value)),
            to: undefined,
        }
    }

    const [rangeValue, setRangeValue] = useState<{from: Date|null|undefined, to:Date|null|undefined}>(createRangeFromValue(value))
    const [showDialog, setShowDialog] = useState(false)
    const [fromInput, setFromInput] = useState<string>(getDisplayDate(rangeValue.from))
    const [toInput, setToInput] = useState<string>(getDisplayDate(rangeValue.to))

    // use ref will only get created initally
    // rerenders will need to set current.
    // could be done with 'useEffect' for clairity but not necessary
    const stateRef = useRef(rangeValue)

    useEffect(() => {
        stateRef.current = rangeValue
    })
    const isRange = rangeValue.to !== undefined

    const locale = intl.locale.toLowerCase()
    if (locale && locale !== 'en' && !loadedLocales[locale]) {
        /* eslint-disable global-require */
        loadedLocales[locale] = require(`moment/locale/${locale}`)
        /* eslint-disable global-require */
    }

    const handleDayClick = (day: Date) => {
        if (isRange) {
            const range = DateUtils.addDayToRange(day, rangeValue)
            saveRangeValue(range)
        } else {
            saveRangeValue({
                from: day,
                to: undefined,
            })
        }
    }

    const onRangeClick = () => {
        let range = {
            from: rangeValue.from,
            to: rangeValue.from,
        }
        if (isRange) {
            range = ({
                from: rangeValue.from,
                to: undefined,
            })
        }
        saveRangeValue(range)
    }

    const onClear = () => {
        const range = createRangeFromValue('')
        saveRangeValue(range)
    }

    const saveRangeValue = (range: any) => {
        setRangeValue(range)
        setFromInput(getDisplayDate(range.from))
        setToInput(getDisplayDate(range.to))
    }

    const onClose = () => {
        const current = stateRef.current
        setShowDialog(false)
        if (current && current.to) {
            onChange([current.from?.getTime().toString() || '', current.to?.getTime().toString() || ''])
        } else if (current && current.from) {
            onChange(current!.from!.getTime().toString())
        } else {
            onChange('')
        }
    }

    let displayValue = ''
    if (rangeValue.from) {
        displayValue = getDisplayDate(rangeValue.from)
    }
    if (rangeValue.to) {
        displayValue += ' -> ' + getDisplayDate(rangeValue.to)
    }

    return (
        <div className={'EditableDayPicker '}>
            <Button
                onClick={() => setShowDialog(true)}
            >
                {displayValue || intl.formatMessage({id: 'EditableDayPicker.empty', defaultMessage: 'Empty'})}
            </Button>

            {showDialog &&
                <ModalWrapper>
                    <Modal
                        onClose={() => {
                            onClose()
                        }
                        }
                    >
                        <div
                            className={className + '-overlayWrapper'}
                        >
                            <div className={className + '-overlay'}>
                                <div className={'inputContainer'}>
                                    <Editable
                                        value={fromInput}
                                        placeholderText={intl.formatMessage({id: 'EditableDayPicker.datePlaceholder', defaultMessage: 'Select Date'})}
                                        onChange={setFromInput}
                                        onSave={() => {
                                            const newDate = new Date(fromInput)
                                            if (newDate && !isNaN(newDate.getTime())) {
                                                setRangeValue((prevRange) => {
                                                    return {...prevRange, from: newDate}
                                                })
                                            } else {
                                                setFromInput(getDisplayDate(rangeValue.from))
                                            }
                                        }}
                                        onCancel={() => {
                                            setFromInput(getDisplayDate(rangeValue.from))
                                        }}
                                    />
                                    {rangeValue.to &&
                                        <Editable
                                            value={toInput}
                                            placeholderText={intl.formatMessage({id: 'EditableDayPicker.datePlaceholder', defaultMessage: 'Select Date'})}
                                            onChange={setToInput}
                                            onSave={() => {
                                                const newDate = new Date(toInput)
                                                if (newDate && !isNaN(newDate.getTime())) {
                                                    setRangeValue((prevRange) => {
                                                        return {...prevRange, to: newDate}
                                                    })
                                                } else {
                                                    setToInput(getDisplayDate(rangeValue.to))
                                                }
                                            }}
                                            onCancel={() => {
                                                setToInput(getDisplayDate(rangeValue.to))
                                            }}
                                        />
                                    }
                                </div>
                                <DayPicker
                                    onDayClick={handleDayClick}
                                    initialMonth={rangeValue.from || new Date()}
                                    showOutsideDays={true}

                                    locale={locale}
                                    localeUtils={MomentLocaleUtils}
                                    todayButton={intl.formatMessage({id: 'EditableDayPicker.today', defaultMessage: 'Today'})}
                                    selectedDays={[rangeValue.from || new Date(), rangeValue]}

                                />
                                <hr/>
                                <SwitchOption
                                    key={'EndDateOn'}
                                    id={'EndDateOn'}
                                    name={intl.formatMessage({id: 'EditableDayPicker.endDate', defaultMessage: 'End date'})}
                                    isOn={isRange}
                                    onClick={onRangeClick}
                                />
                                <hr/>
                                <div
                                    className='MenuOption menu-option'
                                >
                                    <Button
                                        onClick={onClear}
                                    >
                                        {intl.formatMessage({id: 'EditableDayPicker.clear', defaultMessage: 'Clear'})}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Modal>
                </ModalWrapper>
            }
        </div>
    )
}

export default EditableDayPicker
