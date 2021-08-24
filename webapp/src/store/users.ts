// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createSlice, createAsyncThunk, PayloadAction, createSelector} from '@reduxjs/toolkit'

import {default as client} from '../octoClient'
import {IUser} from '../user'

import {initialLoad} from './initialLoad'

import {RootState} from './index'

export const fetchMe = createAsyncThunk(
    'users/fetchMe',
    async () => client.getMe(),
)

type UsersStatus = {
    me: IUser|null
    teamUsers: {[key: string]: IUser}
    loggedIn: boolean|null
}

const usersSlice = createSlice({
    name: 'users',
    initialState: {me: null, teamUsers: {}, loggedIn: null} as UsersStatus,
    reducers: {
        setMe: (state, action: PayloadAction<IUser>) => {
            state.me = action.payload
        },
        setTeamUsers: (state, action: PayloadAction<IUser[]>) => {
            state.teamUsers = action.payload.reduce((acc: {[key: string]: IUser}, user: IUser) => {
                acc[user.id] = user
                return acc
            }, {})
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchMe.fulfilled, (state, action) => {
            state.me = action.payload || null
            state.loggedIn = Boolean(state.me)
        })
        builder.addCase(fetchMe.rejected, (state) => {
            state.me = null
            state.loggedIn = false
        })
        builder.addCase(initialLoad.fulfilled, (state, action) => {
            state.teamUsers = action.payload.teamUsers.reduce((acc: {[key: string]: IUser}, user: IUser) => {
                acc[user.id] = user
                return acc
            }, {})
        })
    },
})

export const {setMe, setTeamUsers} = usersSlice.actions
export const {reducer} = usersSlice

export const getMe = (state: RootState): IUser|null => state.users.me
export const getLoggedIn = (state: RootState): boolean|null => state.users.loggedIn
export const getTeamUsers = (state: RootState): {[key: string]: IUser} => state.users.teamUsers

export const getTeamUsersList = createSelector(
    getTeamUsers,
    (teamUsers) => Object.values(teamUsers).sort((a, b) => a.username.localeCompare(b.username)),
)

export const getUser = (userId: string): (state: RootState) => IUser|undefined => {
    return (state: RootState): IUser|undefined => {
        const users = getTeamUsers(state)
        return users[userId]
    }
}
