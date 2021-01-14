// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

const UserContext = React.createContext(undefined as IUser|undefined)

interface IUser {
    id: string,
    username: string,
    email: string,
    props: Record<string, any>,
    createAt: number,
    updateAt: number,
}

export {IUser, UserContext}
