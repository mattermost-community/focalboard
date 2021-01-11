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
}

class RegisterPage extends React.PureComponent<Props, State> {
    state = {
        email: '',
        username: '',
        password: '',
    }

    private handleRegister = async (): Promise<void> => {
        const registered = await client.register(this.state.email, this.state.username, this.state.password)
        if (registered) {
            const logged = await client.login(this.state.username, this.state.password)
            if (logged) {
                this.props.history.push('/')
            }
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
            </div>
        )
    }
}
export default withRouter(RegisterPage)
