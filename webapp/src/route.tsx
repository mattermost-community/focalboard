// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {
    Redirect,
    Route,
    useRouteMatch,
} from 'react-router-dom'

import {Utils} from './utils'
import {getLoggedIn} from './store/users'
import {useAppSelector} from './store/hooks'
import {UserSettings} from './userSettings'

type RouteProps = {
    path: string|string[]
    exact?: boolean
    render?: (props: any) => React.ReactElement
    children?: React.ReactElement
    getOriginalPath?: (match: any) => string
    loginRequired?: boolean
}

function FBRoute(props: RouteProps) {
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const match = useRouteMatch<any>()

    let originalPath
    if (props.getOriginalPath) {
        originalPath = props.getOriginalPath(match)
    }

    if (Utils.isFocalboardPlugin() && props.path !== '/welcome' && loggedIn === true && !UserSettings.welcomePageViewed) {
        if (originalPath) {
            return <Redirect to={`/welcome?r=${originalPath}`}/>
        }
        return <Redirect to='/welcome'/>
    }

    if (loggedIn === false && props.loginRequired) {
        if (originalPath) {
            let redirectUrl = '/' + Utils.buildURL(originalPath)
            if (redirectUrl.indexOf('//') === 0) {
                redirectUrl = redirectUrl.slice(1)
            }
            const loginUrl = `/login?r=${encodeURIComponent(redirectUrl)}`
            return <Redirect to={loginUrl}/>
        }
        return <Redirect to='/login'/>
    }

    if (loggedIn === true || !props.loginRequired) {
        return (
            <Route
                path={props.path}
                render={props.render}
                exact={props.exact}
            >
                {props.children}
            </Route>
        )
    }
    return null
}

export default React.memo(FBRoute)
