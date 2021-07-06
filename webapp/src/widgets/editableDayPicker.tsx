// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {useIntl} from 'react-intl'
import DayPickerInput from 'react-day-picker/DayPickerInput'
import MomentLocaleUtils from 'react-day-picker/moment'

import 'react-day-picker/lib/style.css'
import './editableDayPicker.scss'

type Props = {
    className: string
    value: string
    dateFormat: string
    onChange: (value: string | undefined) => void
}

const loadedLocales: Record<string, any> = {}

function EditableDayPicker(props: Props): JSX.Element {
    const {className, onChange, dateFormat} = props
    const intl = useIntl()
    const [value, setValue] = useState(props.value ? new Date(parseInt(props.value, 10)) : undefined)

    const locale = intl.locale.toLowerCase()
    if (locale && locale !== 'en' && !loadedLocales[locale]) {
        /* eslint-disable global-require */
        loadedLocales[locale] = require(`moment/locale/${locale}`)
        /* eslint-disable global-require */
    }

    const saveSelection = () => onChange(value?.getTime().toString())

    return (
        <div className={'EditableDayPicker ' + className}>
            <DayPickerInput
                value={value}
                onDayChange={(day: any) => setValue(day)}
                onDayPickerHide={saveSelection}
                inputProps={{
                    onKeyUp: (e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            saveSelection()
                        }
                    },
                }}
                dayPickerProps={{
                    locale,
                    localeUtils: MomentLocaleUtils,
                    todayButton: intl.formatMessage({id: 'EditableDayPicker.today', defaultMessage: 'Today'}),
                }}
                formatDate={MomentLocaleUtils.formatDate}
                parseDate={MomentLocaleUtils.parseDate}
                format={dateFormat}
                placeholder={`${MomentLocaleUtils.formatDate(new Date(), dateFormat, locale)}`}
            />
        </div>
    )
}

export default EditableDayPicker
