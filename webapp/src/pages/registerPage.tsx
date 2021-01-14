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

        const registered = await client.register(this.state.email, this.state.username, this.state.password, signupToken)
        if (registered === 200) {
            const logged = await client.login(this.state.username, this.state.password)
            if (logged) {
                this.props.history.push('/')
            }
        } else if (registered === 401) {
            this.setState({errorMessage: 'Invalid registration link, please contact your administrator'})
        } else {
            this.setState({errorMessage: 'Server error'})
        }
    }

    render(): React.ReactNode {
        return (
            <div className='RegisterPage'>
                <div className='email'>
                    <label htmlFor='login-email'>{'Email'}</label>
                    <input
                        id='login-email'
                        value={this.state.email}
                        onChange={(e) => this.setState({email: e.target.value})}
                    />
                </div>
                <div className='username'>
                    <label htmlFor='login-username'>{'Username'}</label>
                    <input
                        id='login-username'
                        value={this.state.username}
                        onChange={(e) => this.setState({username: e.target.value})}
                    />
                </div>
                <div className='password'>
                    <label htmlFor='login-username'>{'Password'}</label>
                    <input
                        id='login-password'
                        type='password'
                        value={this.state.password}
                        onChange={(e) => this.setState({password: e.target.value})}
                    />
                </div>
                <Button onClick={this.handleRegister}>{'Register'}</Button>
                <Link to='/login'>{'or login if you already have an account'}</Link>
                {this.state.errorMessage &&
                    <div className='error'>
                        {this.state.errorMessage}
                    </div>
                }
            </div>
        )
    }
}
export default withRouter(RegisterPage)
