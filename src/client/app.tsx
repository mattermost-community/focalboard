import React from "react";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import LoginPage from './pages/loginPage';
import BoardPage from './pages/boardPage';

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
              <Route path="/board">
                <BoardPage />
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
