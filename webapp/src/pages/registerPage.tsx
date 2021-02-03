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
import './registerPage.scss'

type Props = RouteComponentProps

type State = {
    email: string
    username: string
    password: string
    errorMessage?: string
}

class RegisterPage extends React.PureComponent<Props, State> {
    state: State = {
        email: '',
        username: '',
        password: '',
    }

    private handleRegister = async (): Promise<void> => {
        const queryString = new URLSearchParams(window.location.search)
        const signupToken = queryString.get('t') || ''

        const response = await client.register(this.state.email, this.state.username, this.state.password, signupToken)
        if (response.code === 200) {
            const logged = await client.login(this.state.username, this.state.password)
            if (logged) {
                this.props.history.push('/')

                // HACKHACK: react-router-dom seems to require a refresh to navigate correctly
                // this.setState({email: '', username: '', password: ''})
            }
        } else if (response.code === 401) {
            this.setState({errorMessage: 'Invalid registration link, please contact your administrator'})
        } else {
            this.setState({errorMessage: response.json?.error})
        }
    }

    render(): React.ReactNode {
        return (
            <div className='RegisterPage'>
                <div className='title'>{'Sign up for your account'}</div>
                <div className='email'>
                    <input
                        id='login-email'
                        placeholder={'Enter email'}
                        value={this.state.email}
                        onChange={(e) => this.setState({email: e.target.value})}
                        onKeyPress={this.onKeyPress}
                    />
                </div>
                <div className='username'>
                    <input
                        id='login-username'
                        placeholder={'Enter username'}
                        value={this.state.username}
                        onChange={(e) => this.setState({username: e.target.value})}
                        onKeyPress={this.onKeyPress}
                    />
                </div>
                <div className='password'>
                    <input
                        id='login-password'
                        type='password'
                        placeholder={'Enter password'}
                        value={this.state.password}
                        onChange={(e) => this.setState({password: e.target.value})}
                        onKeyPress={this.onKeyPress}
                    />
                </div>
                <Button
                    filled={true}
                    onClick={this.handleRegister}
                >
                    {'Register'}
                </Button>
                <Link to='/login'>{'or login if you already have an account'}</Link>
                {this.state.errorMessage &&
                    <div className='error'>
                        {this.state.errorMessage}
                    </div>
                }
            </div>
        )
    }

    private onKeyPress = (e: React.KeyboardEvent) => {
        if (!(e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'Enter') {
            this.handleRegister()
            e.preventDefault()
            return false
        }

        return true
    }
}
export default withRouter(RegisterPage)
