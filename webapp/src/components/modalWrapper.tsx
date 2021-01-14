// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import './modalWrapper.scss'

type Props = {
}

class ModalWrapper extends React.PureComponent<Props> {
    render(): JSX.Element {
        return (
            <div className='ModalWrapper'>
                {this.props.children}
            </div>
        )
    }
}

export default ModalWrapper
