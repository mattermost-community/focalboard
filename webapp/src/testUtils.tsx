// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {IntlProvider} from 'react-intl'
import React from 'react'

export const wrapIntl = (children: any) => <IntlProvider locale='en'>{children}</IntlProvider>
