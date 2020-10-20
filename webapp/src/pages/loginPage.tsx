// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import Button from '../components/button'

import './loginPage.scss'

type Props = {}

type State = {
    username: string;
    password: string;
}

export default class LoginPage extends React.Component<Props, State> {
    state = {
        username: '',
        password: '',
    }

    handleLogin = () => {
        console.log('Logging in')
    }

    render(): React.ReactNode {
        return (
            <div className='LoginPage'>
                <div className='username'>
                    <label htmlFor='login-username'>Username</label>
                    <input
                        id='login-username'
                        value={this.state.username}
                        onChange={(e) => this.setState({username: e.target.value})}
                    />
                </div>
                <div className='password'>
                    <label htmlFor='login-username'>Password</label>
                    <input
                        id='login-password'
                        type='password'
                        value={this.state.password}
                        onChange={(e) => this.setState({password: e.target.value})}
                    />
                </div>
                <Button onClick={this.handleLogin}>Login</Button>
            </div>
        )
    }
}
