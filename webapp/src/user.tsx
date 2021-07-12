// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

interface IUser {
    id: string,
    username: string,
    email: string,
    props: Record<string, any>,
    createAt: number,
    updateAt: number,
}

type WorkspaceUsers = {
    users: Array<IUser>
    usersById: Map<string, IUser>
}

export {IUser, WorkspaceUsers}
