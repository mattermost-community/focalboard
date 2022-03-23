// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {
    Redirect,
    Route,
    useRouteMatch,
} from 'react-router-dom'

import {Utils} from './utils'
import {getLoggedIn, getMe} from './store/users'
import {useAppSelector} from './store/hooks'
import {UserSettingKey} from './userSettings'
import {IUser, UserPropPrefix} from './user'

type RouteProps = {
    path: string|string[]
    exact?: boolean
    render?: (props: any) => React.ReactElement
    component?: React.ComponentType
    children?: React.ReactElement
    getOriginalPath?: (match: any) => string
    loginRequired?: boolean
}

function FBRoute(props: RouteProps) {
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const me = useAppSelector<IUser|null>(getMe)

    let redirect: React.ReactNode = null

    if (Utils.isFocalboardPlugin() && (me?.id !== 'single-user') && props.path !== '/welcome' && loggedIn === true && !me?.props[UserPropPrefix + UserSettingKey.WelcomePageViewed]) {
        if (props.getOriginalPath) {
            redirect = ({match}: any) => {
                return <Redirect to={`/welcome?r=${props.getOriginalPath!(match)}`}/>
            }
        } else {
            redirect = <Redirect to='/welcome'/>
        }
    }

    if (redirect === null && loggedIn === false && props.loginRequired) {
        if (props.getOriginalPath) {
            redirect = ({match}: any) => {
                let redirectUrl = '/' + Utils.buildURL(props.getOriginalPath!(match))
                if (redirectUrl.indexOf('//') === 0) {
                    redirectUrl = redirectUrl.slice(1)
                }
                const loginUrl = `/error?id=not-logged-in&r=${encodeURIComponent(redirectUrl)}`
                return <Redirect to={loginUrl}/>
            }
        } else {
            redirect = <Redirect to='/error?id=not-logged-in'/>
        }
    }

    if (redirect !== null) {
        return (
            <Route
                path={props.path}
                render={props.render}
                component={props.component}
                exact={props.exact}
            >
                {redirect}
            </Route>
        )
    }

    if (loggedIn === true || !props.loginRequired) {
        return (
            <Route
                path={props.path}
                render={props.render}
                component={props.component}
                exact={props.exact}
            >
                {props.children}
            </Route>
        )
    }
    return null
}

export default React.memo(FBRoute)
