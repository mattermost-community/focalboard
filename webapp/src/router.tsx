// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useMemo, useContext} from 'react'
import {
    Router,
    Redirect,
    Switch,
    useRouteMatch,
    useHistory,
    generatePath,
    useLocation,
} from 'react-router-dom'
import {createBrowserHistory, History} from 'history'

import {IAppWindow} from './types'
import BoardPage from './pages/boardPage/boardPage'
import isPagesContext from './isPages'
import ChangePasswordPage from './pages/changePasswordPage'
import WelcomePage from './pages/welcome/welcomePage'
import ErrorPage from './pages/errorPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import {Utils} from './utils'
import octoClient from './octoClient'
import {setGlobalError, getGlobalError} from './store/globalError'
import {useAppSelector, useAppDispatch} from './store/hooks'
import {getFirstTeam, fetchTeams, Team} from './store/teams'
import {UserSettings} from './userSettings'
import FBRoute from './route'

declare let window: IAppWindow

const UUID_REGEX = new RegExp(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)

function HomeToCurrentTeam(props: {path: string, exact: boolean, basePath: string, isPages: boolean}) {
    return (
        <FBRoute
            path={props.path}
            exact={props.exact}
            loginRequired={true}
            component={() => {
                const firstTeam = useAppSelector<Team|null>(getFirstTeam)
                const dispatch = useAppDispatch()
                useEffect(() => {
                    dispatch(fetchTeams())
                }, [])

                let teamID = (window.getCurrentTeamId && window.getCurrentTeamId()) || ''
                const lastTeamID = UserSettings.lastTeamId
                if (!teamID && !firstTeam && !lastTeamID) {
                    return <></>
                }
                teamID = teamID || lastTeamID || firstTeam?.id || ''

                if ((!props.isPages && UserSettings.lastBoardId) || (props.isPages && UserSettings.lastFolderId)) {
                    const lastBoardID = props.isPages ? UserSettings.lastFolderId[teamID] : UserSettings.lastBoardId[teamID]
                    const lastViewID = props.isPages ? UserSettings.lastPageId[lastBoardID] : UserSettings.lastViewId[lastBoardID]

                    if (lastBoardID && lastViewID) {
                        return <Redirect to={props.basePath + `/team/${teamID}/${lastBoardID}/${lastViewID}`}/>
                    }
                    if (lastBoardID) {
                        return <Redirect to={props.basePath + `/team/${teamID}/${lastBoardID}`}/>
                    }
                }

                return <Redirect to={props.basePath + `/team/${teamID}`}/>
            }}
        />
    )
}

function WorkspaceToTeamRedirect(props: {basePath: string}) {
    const match = useRouteMatch<{boardId: string, viewId: string, cardId?: string, workspaceId?: string}>()
    const queryParams = new URLSearchParams(useLocation().search)
    const history = useHistory()
    useEffect(() => {
        octoClient.getBoard(match.params.boardId).then((board) => {
            if (board) {
                let newPath = generatePath(match.path.replace(props.basePath + '/workspace/:workspaceId', props.basePath + '/team/:teamId'), {
                    teamId: board?.teamId,
                    boardId: board?.id,
                    viewId: match.params.viewId,
                    cardId: match.params.cardId,
                })
                if (queryParams) {
                    newPath += '?' + queryParams
                }
                history.replace(newPath)
            }
        })
    }, [])
    return null
}

function GlobalErrorRedirect(props: {basePath: string}) {
    const globalError = useAppSelector<string>(getGlobalError)
    const dispatch = useAppDispatch()
    const history = useHistory()

    useEffect(() => {
        if (globalError) {
            dispatch(setGlobalError(''))
            history.replace(props.basePath + `/error?id=${globalError}`)
        }
    }, [globalError, history])

    return null
}

type Props = {
    history?: History<unknown>
}

const FocalboardRouter = (props: Props): JSX.Element => {
    const isPlugin = Utils.isFocalboardPlugin()
    const isPages = useContext(isPagesContext)

    let basePath = ''
    if (isPlugin && isPages) {
        basePath = '/pages'
    } else if (isPlugin && !isPages) {
        basePath = '/boards'
    }

    let browserHistory: History<unknown>
    if (props.history) {
        browserHistory = props.history
    } else {
        browserHistory = useMemo(() => {
            return createBrowserHistory({basename: Utils.getFrontendBaseURL()})
        }, [])
    }

    if (isPlugin) {
        useEffect(() => {
            if (window.frontendBaseURL) {
                if (isPages) {
                    browserHistory.replace('/pages')
                } else {
                    browserHistory.replace('/boards')
                }
            }
        }, [])
    }

    return (
        <Router history={browserHistory}>
            <GlobalErrorRedirect basePath={basePath}/>
            <Switch>
                {isPlugin &&
                    <HomeToCurrentTeam
                        path={basePath + '/'}
                        basePath={basePath}
                        exact={true}
                        isPages={isPages}
                    />}
                {isPlugin &&
                    <FBRoute
                        exact={true}
                        path={basePath + '/welcome'}
                    >
                        <WelcomePage/>
                    </FBRoute>}

                <FBRoute path={basePath + '/error'}>
                    <ErrorPage/>
                </FBRoute>

                {!isPlugin &&
                    <FBRoute path={basePath + '/login'}>
                        <LoginPage/>
                    </FBRoute>}
                {!isPlugin &&
                    <FBRoute path={basePath + '/register'}>
                        <RegisterPage/>
                    </FBRoute>}
                {!isPlugin &&
                    <FBRoute path={basePath + '/change_password'}>
                        <ChangePasswordPage/>
                    </FBRoute>}

                <FBRoute path={[basePath + '/team/:teamId/new/:channelId']}>
                    <BoardPage new={true}/>
                </FBRoute>

                <FBRoute path={[basePath + '/team/:teamId/shared/:boardId?/:viewId?/:cardId?', basePath + '/shared/:boardId?/:viewId?/:cardId?']}>
                    <BoardPage readonly={true}/>
                </FBRoute>

                <FBRoute
                    loginRequired={true}
                    path={basePath + '/board/:boardId?/:viewId?/:cardId?'}
                    getOriginalPath={({params: {boardId, viewId, cardId}}) => {
                        return `/board/${Utils.buildOriginalPath('', boardId, viewId, cardId)}`
                    }}
                >
                    <BoardPage/>
                </FBRoute>
                <FBRoute path={[basePath + '/workspace/:workspaceId/shared/:boardId?/:viewId?/:cardId?', basePath + '/workspace/:workspaceId/:boardId?/:viewId?/:cardId?']}>
                    <WorkspaceToTeamRedirect basePath={basePath}/>
                </FBRoute>
                <FBRoute
                    loginRequired={true}
                    path={basePath + '/team/:teamId/:boardId?/:viewId?/:cardId?'}
                    getOriginalPath={({params: {teamId, boardId, viewId, cardId}}) => {
                        return `/team/${Utils.buildOriginalPath(teamId, boardId, viewId, cardId)}`
                    }}
                >
                    <BoardPage/>
                </FBRoute>

                {!isPlugin &&
                    <FBRoute
                        path={basePath + '/:boardId?/:viewId?/:cardId?'}
                        loginRequired={true}
                        getOriginalPath={({params: {boardId, viewId, cardId}}) => {
                            const boardIdIsValidUUIDV4 = UUID_REGEX.test(boardId || '')
                            if (boardIdIsValidUUIDV4) {
                                return `/${Utils.buildOriginalPath('', boardId, viewId, cardId)}`
                            }
                            return ''
                        }}
                    >
                        <BoardPage/>
                    </FBRoute>}
            </Switch>
        </Router>
    )
}

export default React.memo(FocalboardRouter)
