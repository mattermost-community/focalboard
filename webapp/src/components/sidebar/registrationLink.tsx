// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IWorkspace} from '../../blocks/workspace'
import {sendFlashMessage} from '../../components/flashMessages'
import client from '../../octoClient'
import {Utils} from '../../utils'
import Button from '../../widgets/buttons/button'

import Modal from '../modal'

import './registrationLink.scss'

type Props = {
    onClose: () => void
    intl: IntlShape
}

const RegistrationLink = React.memo((props: Props) => {
    const {intl, onClose} = props

    const [wasCopied, setWasCopied] = useState(false)
    const [workspace, setWorkspace] = useState<IWorkspace>()

    const loadData = async () => {
        const updatedWorkspace = await client.getWorkspace()
        setWorkspace(updatedWorkspace)
        setWasCopied(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const regenerateToken = async () => {
        // eslint-disable-next-line no-alert
        const accept = window.confirm(intl.formatMessage({id: 'RegistrationLink.confirmRegenerateToken', defaultMessage: 'This will invalidate previously shared links. Continue?'}))
        if (accept) {
            await client.regenerateWorkspaceSignupToken()
            await loadData()

            const description = intl.formatMessage({id: 'RegistrationLink.tokenRegenerated', defaultMessage: 'Registration link regenerated'})
            sendFlashMessage({content: description, severity: 'low'})
        }
    }

    const registrationUrl = window.location.origin + '/register?t=' + workspace?.signupToken

    return (
        <Modal
            position='bottom-right'
            onClose={onClose}
        >
            <div className='RegistrationLink'>
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
                                setWasCopied(true)
                            }}
                        >
                            {wasCopied ? intl.formatMessage({id: 'RegistrationLink.copiedLink', defaultMessage: 'Copied!'}) : intl.formatMessage({id: 'RegistrationLink.copyLink', defaultMessage: 'Copy link'})}
                        </Button>
                    </div>
                    <div className='row'>
                        <Button onClick={regenerateToken}>
                            {intl.formatMessage({id: 'RegistrationLink.regenerateToken', defaultMessage: 'Regenerate token'})}
                        </Button>
                    </div>
                </>}
            </div>
        </Modal>
    )
})

export default injectIntl(RegistrationLink)
