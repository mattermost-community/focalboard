// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

interface IUser {
    id: string,
    username: string,
    email: string,
    nickname: string,
    firstname: string,
    lastname: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>,
    create_at: number,
    update_at: number,
    is_bot: boolean,
    roles: string,
}

interface UserWorkspace {
    id: string
    title: string
    boardCount: number
}

interface UserConfigPatch {
    updatedFields?: Record<string, string>
    deletedFields?: string[]
}

function parseUserProps(props: Record<string, any>): Record<string, any> {
    const processedProps = props
    const hiddenBoardIDs = props.hiddenBoardIDs ? JSON.parse(props.hiddenBoardIDs) : []
    processedProps.hiddenBoardIDs = {}
    hiddenBoardIDs.forEach((boardID: string) => processedProps.hiddenBoardIDs[boardID] = true)
    return processedProps
}

const UserPropPrefix = 'focalboard_'

export {
    IUser,
    UserWorkspace,
    UserConfigPatch,
    UserPropPrefix,
    parseUserProps,
}
