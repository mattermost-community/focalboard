// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './welcomePage.scss'

const WelcomePage = React.memo(() => (
    <div className='WelcomePage'>
        <h1> Welcome To Boards </h1>
        <h3> Boards is a project management tool that helps define, organize, track and manage work across teams, using a familiar kanban board view</h3>

        {/*Picture */}

        <button>
            Explore
        </button>
    </div>
))

export default WelcomePage
