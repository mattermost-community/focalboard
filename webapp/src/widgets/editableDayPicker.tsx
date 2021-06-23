// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
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

    // Utils.log('value ' + value as string)

    const getInitialState = (initialValue: string | string[]) => {
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

    const [rangeValue, setRangeValue] = useState<{from: Date|null|undefined, to:Date|null|undefined}>(getInitialState(value))
    const [showDialog, setShowDialog] = useState(false)
    const [fromInput, setFromInput] = useState<string>(rangeValue?.from?.toLocaleDateString() || '')
    const [toInput, setToInput] = useState<string>(rangeValue?.to?.toLocaleDateString() || '')

    const from = rangeValue.from || new Date()
    const to = rangeValue.to || undefined
    const isRange = to !== undefined
    const modifiers = {start: from, end: to}
    const locale = intl.locale.toLowerCase()
    if (locale && locale !== 'en' && !loadedLocales[locale]) {
        /* eslint-disable global-require */
        loadedLocales[locale] = require(`moment/locale/${locale}`)
        /* eslint-disable global-require */
    }

    const handleDayClick = (day: Date) => {
        // Utils.log('handleclick ' + rangeValue.from)
        if (isRange) {
            const range = DateUtils.addDayToRange(day, rangeValue)
            saveRangeValue(range)
        } else {
            saveRangeValue({
                from: day,
                to: undefined,
            })
        }

        // Utils.log('handleclick-end ' + rangeValue.from)
    }

    const onRangeClick = () => {
        // Utils.log('rangeClick ' + rangeValue.from)
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

    let displayValue = rangeValue?.from?.toLocaleDateString()
    if (rangeValue.to) {
        displayValue += ' -> ' + rangeValue.to.toLocaleDateString()
    }

    // Utils.log('preSaveSelection ' + rangeValue.from)
    const saveRangeValue = (range: any) => {
        // Utils.log('saveSelection ' + range.from)
        setRangeValue(range)
        setFromInput(range.from.toLocaleDateString())
        setToInput(range.to?.toLocaleDateString() || '')
    }

    const onClose = () => {
        Utils.log('onClose ' + rangeValue.from)
        setShowDialog(false)
        if (rangeValue && rangeValue.to) {
            onChange([rangeValue.from?.getTime().toString() || '', rangeValue.to?.getTime().toString() || ''])
        } else if (rangeValue !== undefined && rangeValue.from !== undefined) {
            onChange(rangeValue!.from!.getTime().toString())
        }
    }

    // const dateFormat = 'l'1

    return (
        <ModalWrapper>
            <div
                className='octo-propertyvalue'
                onClick={() => setShowDialog(true)}
            >
                {displayValue}
            </div>

            {showDialog &&
                <Modal
                    onClose={() => onClose()}
                >
                    <div
                        className={className + '-overlayWrapper'}
                    >
                        <div className={className + '-overlay'}>
                            <div>
                                {rangeValue.from &&
                                    <Editable
                                        value={fromInput}
                                        placeholderText='New Date'
                                        onChange={setFromInput}
                                        onSave={() => {
                                            const newDate = new Date(fromInput)
                                            if (newDate && !isNaN(newDate.getTime())) {
                                                setRangeValue((prevRange) => {
                                                    return {...prevRange, from: newDate}
                                                })
                                            } else {
                                                setFromInput(rangeValue?.from?.toLocaleDateString() || '')
                                            }
                                        }}
                                        onCancel={() => {
                                            setFromInput(rangeValue?.from?.toLocaleDateString() || '')
                                        }}

                                        // readonly={props.readonly || !group.option.id}
                                    />
                                }
                                {rangeValue.to &&
                                    <Editable
                                        value={toInput}
                                        placeholderText='New Date'
                                        onChange={setToInput}
                                        onSave={() => {
                                            const newDate = new Date(toInput)
                                            if (newDate && !isNaN(newDate.getTime())) {
                                                setRangeValue((prevRange) => {
                                                    return {...prevRange, to: newDate}
                                                })
                                            } else {
                                                setToInput(rangeValue?.to?.toLocaleDateString() || '')
                                            }
                                        }}
                                        onCancel={() => {
                                            setToInput(rangeValue?.to?.toLocaleDateString() || '')
                                        }}

                                        // readonly={props.readonly || !group.option.id}
                                    />
                                }
                            </div>
                            <DayPicker
                                onDayClick={handleDayClick}

                                locale={locale}
                                localeUtils={MomentLocaleUtils}
                                todayButton={intl.formatMessage({id: 'EditableDayPicker.today', defaultMessage: 'Today'})}
                                selectedDays={[from, rangeValue]}
                                modifiers={modifiers}

                                // formatDate={MomentLocaleUtils.formatDate}
                                // parseDate={MomentLocaleUtils.parseDate}
                                // format={dateFormat}
                                // placeholder={`${MomentLocaleUtils.formatDate(new Date(), dateFormat, locale)}`}
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
                            <Button onClick={onClose}>
                                {intl.formatMessage({id: 'EditableDayPicker.save', defaultMessage: 'Save'})}
                            </Button>
                        </div>
                    </div>
                </Modal>
            }
        </ModalWrapper>
    )
}

export default EditableDayPicker
