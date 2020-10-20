// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';

type Props = {
}

class PageHeader extends React.Component<Props> {
    render() {
        return (
            <div className='page-header'>
                <a href='/'>OCTO</a>
            </div>
        )
    }
}

export {PageHeader}
