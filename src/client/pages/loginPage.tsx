import React from "react"

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
        console.log("Logging in");
    }

    public render(): React.ReactNode {
        return (
            <div className='LoginPage'>
                <label htmlFor='login-username'>Username</label>
                <input
                    id='login-username'
                    value={this.state.username}
                    onChange={(e) => this.setState({username: e.target.value})}
                />
                <label htmlFor='login-username'>Password</label>
                <input
                    id='login-password'
                />
                <button onClick={this.handleLogin}>Login</button>
            </div>
        )
    }
}
