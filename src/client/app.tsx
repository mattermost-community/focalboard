import React from "react";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import LoginPage from './pages/loginPage';
import HomePage from './pages/homePage';

export default function App() {
  return (
    <Router>
      <div>
        <header id="header">
            <a href="/">OCTO</a>
        </header>

        <main id="main">
            <Switch>
              <Route path="/login">
                <LoginPage />
              </Route>
              <Route path="/">
                <HomePage />
              </Route>
            </Switch>
        </main>

        <footer id="footer">
        </footer>

        <div id="overlay">
        </div>
      </div>
    </Router>
  );
}
