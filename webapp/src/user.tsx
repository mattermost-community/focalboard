// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

interface IUser {
    id: string,
    username: string,
    email: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>,
    createAt: number,
    updateAt: number,
}

interface UserWorkspace {
    id: string
    title: string
    boardCount: number
}

export {IUser, UserWorkspace}
