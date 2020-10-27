// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import ReactDOM from 'react-dom'

import App from './app'
import {setTheme, lightTheme} from './theme'

import './styles/main.scss'
import './styles/colors.scss'

setTheme(lightTheme)
ReactDOM.render(<App/>, document.getElementById('octo-tasks-app'))
