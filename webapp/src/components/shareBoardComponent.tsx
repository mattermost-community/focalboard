// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {ISharing} from '../blocks/sharing'

import client from '../octoClient'

import {Utils} from '../utils'
import {sendFlashMessage} from '../components/flashMessages'

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
    wasCopied: boolean
}

class ShareBoardComponent extends React.PureComponent<Props, State> {
    state: State = {wasCopied: false}

    componentDidMount(): void {
        this.loadData()
    }

    private async loadData() {
        const sharing = await client.getSharing(this.props.boardId)
        this.setState({sharing, wasCopied: false})
    }

    render(): JSX.Element {
        const {intl} = this.props
        const {sharing} = this.state

        const isSharing = Boolean(sharing && sharing.id === this.props.boardId && sharing.enabled)
        const readToken = (sharing && isSharing) ? sharing.token : ''
        const shareUrl = new URL(window.location.toString())
        shareUrl.searchParams.set('r', readToken)
        shareUrl.pathname = '/shared'

        let stateDescription: string
        if (isSharing) {
            stateDescription = intl.formatMessage({id: 'ShareBoard.unshare', defaultMessage: 'Anyone with the link can view this board'})
        } else {
            stateDescription = intl.formatMessage({id: 'ShareBoard.share', defaultMessage: 'Publish to web and share this board to anyone'})
        }
        return (
            <Modal
                onClose={this.props.onClose}
            >
                <div className='ShareBoardComponent'>
                    <div className='row'>
                        <div>{stateDescription}</div>
                        <div className='spacer'/>
                        <Switch
                            isOn={Boolean(isSharing)}
                            onChanged={this.onShareChanged}
                        />
                    </div>
                    {isSharing && <>
                        <div className='row'>
                            <a
                                className='shareUrl'
                                href={shareUrl.toString()}
                                target='_blank'
                                rel='noreferrer'
                            >
                                {shareUrl.toString()}
                            </a>
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
                        <div className='row'>
                            <Button onClick={this.onRegenerateToken}>
                                {intl.formatMessage({id: 'ShareBoard.regenerateToken', defaultMessage: 'Regenerate token'})}
                            </Button>
                        </div>
                    </>}
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
        await client.setSharing(sharing)
        await this.loadData()
    }

    private onRegenerateToken = async () => {
        const {intl} = this.props
        // eslint-disable-next-line no-alert
        const accept = window.confirm(intl.formatMessage({id: 'ShareBoard.confirmRegenerateToken', defaultMessage: 'This will invalidate previously shared links. Continue?'}))
        if (accept) {
            const sharing: ISharing = this.state.sharing || this.createSharingInfo()
            sharing.token = Utils.createGuid()
            await client.setSharing(sharing)
            await this.loadData()

            const description = intl.formatMessage({id: 'ShareBoard.tokenRegenrated', defaultMessage: 'Token regenerated'})
            sendFlashMessage({content: description, severity: 'low'})
        }
    }
}

export default injectIntl(ShareBoardComponent)
