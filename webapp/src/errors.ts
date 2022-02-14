// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

enum ErrorId {
    WorkspaceUndefined = 'workspace-undefined',
    NotLoggedIn = 'not-logged-in',
}

type ErrorDef = {
    titleId: string

    button1Enabled: boolean
    button1Id: string
    button1Redirect: string | (() => string)
    button1Fill: boolean

    button2Enabled: boolean
    button2Id: string
    button2Redirect: string | (() => string)
    button2Fill: boolean
}

function errorDefFromId(id: ErrorId | null): ErrorDef {
    const errDef = {
        titleId: '',
        button1Enabled: false,
        button1Id: '',
        button1Redirect: '',
        button1Fill: false,
        button2Enabled: false,
        button2Id: '',
        button2Redirect: '',
        button2Fill: false,
    }

    switch (id) {
    case ErrorId.WorkspaceUndefined: {
        errDef.titleId = 'error.workspace-undefined'
        errDef.button1Enabled = true
        errDef.button1Id = 'error.go-dashboard'
        errDef.button1Redirect = '/dashboard'
        errDef.button1Fill = true
        break
    }
    case ErrorId.NotLoggedIn: {
        errDef.titleId = 'error.not-logged-in'
        errDef.button1Enabled = true
        errDef.button1Id = 'error.go-login'
        errDef.button1Redirect = '/login'
        errDef.button1Fill = true
        break
    }
    default: {
        errDef.titleId = 'error.unknown'
        errDef.button1Enabled = true
        errDef.button1Id = 'error.go-dashboard'
        errDef.button1Redirect = '/dashboard'
        errDef.button1Fill = true
        break
    }
    }
    return errDef
}

export {ErrorId, ErrorDef, errorDefFromId}
