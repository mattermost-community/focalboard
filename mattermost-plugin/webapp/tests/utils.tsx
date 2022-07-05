import React from 'react'
import {IntlProvider} from 'react-intl'

export const wrapIntl = (children?: React.ReactNode): JSX.Element => (
    <IntlProvider locale='en'>
        {children}
    </IntlProvider>
)
