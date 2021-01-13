// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {ISharing} from '../blocks/sharing'

import client from '../octoClient'

import {Utils} from '../utils'

import Button from '../widgets/buttons/button'
import Switch from '../widgets/switch'

import Modal from './modal'
import './shareBoardComponent.scss'

type Props = {
    boardId: string
    onClose: () => void
    intl: IntlShape
}

type State = {
    sharing?: ISharing
    wasCopied?: boolean
}

class ShareBoardComponent extends React.PureComponent<Props, State> {
    state: State = {}

    componentDidMount() {
        this.loadData()
    }

    private async loadData() {
        const sharing = await client.getSharing(this.props.boardId)
        this.setState({sharing})
    }

    render(): JSX.Element {
        const {intl} = this.props
        const {sharing} = this.state

        const isSharing = sharing && sharing.id === this.props.boardId && sharing.enabled
        const readToken = (sharing && isSharing) ? sharing.token : ''
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
                            isOn={Boolean(isSharing)}
                            onChanged={this.onShareChanged}
                        />
                    </div>
                    {isSharing &&
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

    private createSharingInfo() {
        const sharing: ISharing = {
            id: this.props.boardId,
            enabled: true,
            token: Utils.createGuid(),
        }
        return sharing
    }

    private onShareChanged = async (isOn: boolean) => {
        const sharing: ISharing = this.state.sharing || this.createSharingInfo()
        sharing.id = this.props.boardId
        sharing.enabled = isOn
        sharing.token = Utils.createGuid()
        await client.setSharing(sharing)
        await this.loadData()
    }
}

export default injectIntl(ShareBoardComponent)
