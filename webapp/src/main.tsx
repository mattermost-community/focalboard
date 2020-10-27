// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import ReactDOM from 'react-dom'

import App from './app'
import {loadTheme} from './theme'

import './styles/main.scss'
import './styles/colors.scss'

loadTheme()
ReactDOM.render(<App/>, document.getElementById('octo-tasks-app'))
