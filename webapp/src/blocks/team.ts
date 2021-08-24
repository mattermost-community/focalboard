// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
interface ITeam {
    readonly id: string,
    readonly title: string,
    readonly signupToken: string,
    readonly settings: Readonly<Record<string, any>>
    readonly modifiedBy?: string,
    readonly updateAt?: number,
}

export {ITeam}
