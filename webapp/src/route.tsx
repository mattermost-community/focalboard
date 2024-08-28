// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {
    Redirect,
    Route,
} from 'react-router-dom'

import {Utils} from './utils'
import {getLoggedIn} from './store/users'
import {useAppSelector} from './store/hooks'

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
    let redirect: React.ReactNode = null

    if (redirect === null && loggedIn === false && props.loginRequired) {
        redirect = ({match}: any) => {
            if (props.getOriginalPath) {
                let redirectUrl = '/' + Utils.buildURL(props.getOriginalPath!(match))
                if (redirectUrl.indexOf('//') === 0) {
                    redirectUrl = redirectUrl.slice(1)
                }
                const loginUrl = `/error?id=not-logged-in&r=${encodeURIComponent(redirectUrl)}`
                return <Redirect to={loginUrl}/>
            }
            return <Redirect to='/error?id=not-logged-in'/>
        }
    }

    return (
        <Route
            path={props.path}
            render={props.render}
            component={props.component}
            exact={props.exact}
        >
            {redirect || props.children}
        </Route>
    )
}

export default React.memo(FBRoute)
