import React from "react"

import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link
} from "react-router-dom"

import LoginPage from './pages/loginPage'
import BoardPage from './pages/boardPage'

export default function App() {
	return (
		<Router>
			<div id="frame">
				<div className="page-header">
					<a href="/">OCTO</a>
				</div>

				<div id="main">
					<Switch>
						<Route path="/login">
							<LoginPage />
						</Route>
						<Route path="/board">
							<BoardPage />
						</Route>
					</Switch>
				</div>

				<div id="overlay">
				</div>
			</div>
		</Router>
	)
}
