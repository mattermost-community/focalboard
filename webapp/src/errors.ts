// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

enum ErrorId {
    WorkspaceUndefined = 'workspace-undefined',
    NotLoggedIn = 'not-logged-in',
}

type ErrorDef = {
    titleId: string

    button1Id?: string
    button1Redirect?: string | (() => string)
    button1Fill?: boolean

    button2Id?: string
    button2Redirect?: string | (() => string)
    button2Fill?: boolean
}

function errorDefFromId(id: ErrorId | null): ErrorDef {
    switch (id) {
    case ErrorId.WorkspaceUndefined: {
        return {
            titleId: 'error.workspace-undefined',
            button1Id: 'error.go-dashboard',
            button1Redirect: '/dashboard',
            button1Fill: true,
        }
    }
    case ErrorId.NotLoggedIn: {
        return {
            titleId: 'error.not-logged-in',
            button1Id: 'error.go-login',
            button1Redirect: '/login',
            button1Fill: true,
        }
    }
    default: {
        return {
            titleId: 'error.unknown',
            button1Id: 'error.go-dashboard',
            button1Redirect: '/dashboard',
            button1Fill: true,
        }
    }
    }
}

export {ErrorId, ErrorDef, errorDefFromId}
