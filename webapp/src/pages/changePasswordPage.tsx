// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {
    withRouter,
    RouteComponentProps,
    Link,
} from 'react-router-dom'

import Button from '../widgets/buttons/button'
import client from '../octoClient'
import './changePasswordPage.scss'
import {UserContext} from '../user'

type Props = RouteComponentProps

type State = {
    oldPassword: string
    newPassword: string
    errorMessage?: string
    succeeded: boolean
}

class ChangePasswordPage extends React.PureComponent<Props, State> {
    state: State = {
        oldPassword: '',
        newPassword: '',
        succeeded: false,
    }

    private handleSubmit = async (userId: string): Promise<void> => {
        const response = await client.changePassword(userId, this.state.oldPassword, this.state.newPassword)
        if (response.code === 200) {
            this.setState({oldPassword: '', newPassword: '', errorMessage: undefined, succeeded: true})
        } else {
            this.setState({errorMessage: `Change password failed: ${response.json?.error}`})
        }
    }

    render(): React.ReactNode {
        return (
            <div className='ChangePasswordPage'>
                <div className='title'>{'Change Password'}</div>

                <UserContext.Consumer>
                    {(user) => {
                        if (user) {
                            return (<>
                                <div className='oldPassword'>
                                    <input
                                        id='login-oldpassword'
                                        type='password'
                                        placeholder={'Enter current password'}
                                        value={this.state.oldPassword}
                                        onChange={(e) => this.setState({oldPassword: e.target.value, errorMessage: undefined})}
                                        onKeyPress={(e) => this.onKeyPress(e, user.id)}
                                    />
                                </div>
                                <div className='newPassword'>
                                    <input
                                        id='login-newpassword'
                                        type='password'
                                        placeholder={'Enter new password'}
                                        value={this.state.newPassword}
                                        onChange={(e) => this.setState({newPassword: e.target.value, errorMessage: undefined})}
                                        onKeyPress={(e) => this.onKeyPress(e, user.id)}
                                    />
                                </div>
                                <Button
                                    filled={true}
                                    onClick={() => this.handleSubmit(user.id)}
                                >
                                    {'Change password'}
                                </Button>
                                {this.state.errorMessage &&
                                    <div className='error'>
                                        {this.state.errorMessage}
                                    </div>
                                }
                                {this.state.succeeded &&
                                    <Link
                                        className='succeeded'
                                        to='/'
                                    >{'Password changed, click to continue.'}</Link>
                                }
                                {!this.state.succeeded &&
                                    <Link to='/'>{'Cancel'}</Link>
                                }
                            </>)
                        }
                        return (
                            <Link to='/login'>{'Log in first'}</Link>
                        )
                    }}
                </UserContext.Consumer>
            </div>
        )
    }

    private onKeyPress = (e: React.KeyboardEvent, userId: string) => {
        if (!(e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'Enter') {
            this.handleSubmit(userId)
            e.preventDefault()
            return false
        }

        return true
    }
}

export default withRouter(ChangePasswordPage)
