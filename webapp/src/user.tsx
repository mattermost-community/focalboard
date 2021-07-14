// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

interface IUser {
    id: string,
    username: string,
    email: string,
    props: Record<string, any>,
    createAt: number,
    updateAt: number,
}

export {IUser}
