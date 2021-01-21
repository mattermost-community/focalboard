// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IWorkspace} from '../blocks/workspace'
import {sendFlashMessage} from '../components/flashMessages'
import client from '../octoClient'
import {Utils} from '../utils'
import Button from '../widgets/buttons/button'

import Modal from './modal'
import './registrationLinkComponent.scss'

type Props = {
    onClose: () => void
    intl: IntlShape
}

type State = {
    workspace?: IWorkspace
    wasCopied: boolean
}

class RegistrationLinkComponent extends React.PureComponent<Props, State> {
    state: State = {wasCopied: false}

    componentDidMount() {
        this.loadData()
    }

    private async loadData() {
        const workspace = await client.getWorkspace()
        this.setState({workspace, wasCopied: false})
    }

    render(): JSX.Element {
        const {intl} = this.props
        const {workspace} = this.state

        const registrationUrl = window.location.origin + '/register?t=' + workspace?.signupToken

        return (
            <Modal
                position='bottom-right'
                onClose={this.props.onClose}
            >
                <div className='RegistrationLinkComponent'>
                    {workspace && <>
                        <div className='row'>
                            {intl.formatMessage({id: 'RegistrationLink.description', defaultMessage: 'Share this link for others to create accounts:'})}
                        </div>
                        <div className='row'>
                            <a
                                className='shareUrl'
                                href={registrationUrl}
                                target='_blank'
                                rel='noreferrer'
                            >
                                {registrationUrl}
                            </a>
                            <Button
                                filled={true}
                                onClick={() => {
                                    Utils.copyTextToClipboard(registrationUrl)
                                    this.setState({wasCopied: true})
                                }}
                            >
                                {this.state.wasCopied ? intl.formatMessage({id: 'RegistrationLink.copiedLink', defaultMessage: 'Copied!'}) : intl.formatMessage({id: 'RegistrationLink.copyLink', defaultMessage: 'Copy link'})}
                            </Button>
                        </div>
                        <div className='row'>
                            <Button onClick={this.onRegenerateToken}>
                                {intl.formatMessage({id: 'RegistrationLink.regenerateToken', defaultMessage: 'Regenerate token'})}
                            </Button>
                        </div>
                    </>}
                </div>
            </Modal>
        )
    }

    private onRegenerateToken = async () => {
        const {intl} = this.props
        // eslint-disable-next-line no-alert
        const accept = window.confirm(intl.formatMessage({id: 'RegistrationLink.confirmRegenerateToken', defaultMessage: 'This will invalidate previously shared links. Continue?'}))
        if (accept) {
            await client.regenerateWorkspaceSignupToken()
            await this.loadData()

            const description = intl.formatMessage({id: 'RegistrationLink.tokenRegenerated', defaultMessage: 'Registration link regenerated'})
            sendFlashMessage({content: description, severity: 'low'})
        }
    }
}

export default injectIntl(RegistrationLinkComponent)
