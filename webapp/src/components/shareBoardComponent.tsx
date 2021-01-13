// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {Utils} from '../utils'

import Button from '../widgets/buttons/button'
import Switch from '../widgets/switch'

import Modal from './modal'
import './shareBoardComponent.scss'

type Props = {
    onClose: () => void
    intl: IntlShape
}

type State = {
    isShared?: boolean
    wasCopied?: boolean
}

class ShareBoardComponent extends React.PureComponent<Props, State> {
    state: State = {}

    render(): JSX.Element {
        const {intl} = this.props

        const readToken = '123'
        const shareUrl = new URL(window.location.toString())
        shareUrl.searchParams.set('r', readToken)

        return (
            <Modal
                onClose={this.props.onClose}
            >
                <div className='ShareBoardComponent'>
                    <div className='row'>
                        <div>{intl.formatMessage({id: 'ShareBoard.share', defaultMessage: 'Publish to web and share this board to anyone'})}</div>
                        <div className='spacer'/>
                        <Switch
                            isOn={Boolean(this.state.isShared)}
                            onChanged={this.onShareChanged}
                        />
                    </div>
                    {this.state.isShared &&
                        <div className='row'>
                            <input
                                className='shareUrl'
                                readOnly={true}
                                value={shareUrl.toString()}
                            />
                            <Button
                                filled={true}
                                onClick={() => {
                                    Utils.copyTextToClipboard(shareUrl.toString())
                                    this.setState({wasCopied: true})
                                }}
                            >
                                {this.state.wasCopied ? intl.formatMessage({id: 'ShareBoard.copiedLink', defaultMessage: 'Copied!'}) : intl.formatMessage({id: 'ShareBoard.copyLink', defaultMessage: 'Copy link'})}
                            </Button>
                        </div>
                    }
                </div>
            </Modal>
        )
    }

    private onShareChanged = (isOn: boolean) => {
        // TODO
        this.setState({isShared: isOn})
    }
}

export default injectIntl(ShareBoardComponent)
