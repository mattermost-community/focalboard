// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIntl} from 'react-intl'

enum ErrorId {
    WorkspaceUndefined = 'workspace-undefined',
    NotLoggedIn = 'not-logged-in',
}

type ErrorDef = {
    title: string

    button1Enabled: boolean
    button1Text: string
    button1Redirect: string | (() => string)
    button1Fill: boolean

    button2Enabled: boolean
    button2Text: string
    button2Redirect: string | (() => string)
    button2Fill: boolean
}

function errorDefFromId(id: ErrorId | null): ErrorDef {
    const errDef = {
        title: '',
        button1Enabled: false,
        button1Text: '',
        button1Redirect: '',
        button1Fill: false,
        button2Enabled: false,
        button2Text: '',
        button2Redirect: '',
        button2Fill: false,
    }

    const intl = useIntl()

    switch (id) {
    case ErrorId.WorkspaceUndefined: {
        errDef.title = intl.formatMessage({id: 'error.workspace-undefined', defaultMessage: 'Not a valid workspace.'})
        errDef.button1Enabled = true
        errDef.button1Text = intl.formatMessage({id: 'error.go-dashboard', defaultMessage: 'Go to the Dashboard'})
        errDef.button1Redirect = '/dashboard'
        errDef.button1Fill = true
        break
    }
    case ErrorId.NotLoggedIn: {
        errDef.title = intl.formatMessage({id: 'error.not-logged-in', defaultMessage: 'Your session may have expired or you\'re not logged in. Log in again to access Boards.'})
        errDef.button1Enabled = true
        errDef.button1Text = intl.formatMessage({id: 'error.go-login', defaultMessage: 'Log in'})
        errDef.button1Redirect = '/login'
        errDef.button1Fill = true
        break
    }
    default: {
        errDef.title = intl.formatMessage({id: 'error.unknown', defaultMessage: 'An error occurred.'})
        errDef.button1Enabled = true
        errDef.button1Text = intl.formatMessage({id: 'error.go-dashboard', defaultMessage: 'Go to the Dashboard'})
        errDef.button1Redirect = '/dashboard'
        errDef.button1Fill = true
        break
    }
    }
    return errDef
}

export {ErrorId, ErrorDef, errorDefFromId}
