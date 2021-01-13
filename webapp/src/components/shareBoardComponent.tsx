// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import Modal from './modal'

type Props = {
    onClose: () => void
    intl: IntlShape
}

class ShareBoardComponent extends React.PureComponent<Props> {
    render(): JSX.Element {
        return (
            <Modal
                onClose={this.props.onClose}
            >
                {'TODO'}
            </Modal>
        )
    }
}

export default injectIntl(ShareBoardComponent)
