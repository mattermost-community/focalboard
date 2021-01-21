// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import IconButton from '../widgets/buttons/iconButton'
import CloseIcon from '../widgets/icons/close'
import './modal.scss'

type Props = {
    onClose: () => void
    intl: IntlShape
    position?: 'top'|'bottom'|'bottom-right'
}

class Modal extends React.PureComponent<Props> {
    private node: React.RefObject<HTMLDivElement>

    public constructor(props: Props) {
        super(props)
        this.node = React.createRef()
    }

    public componentDidMount(): void {
        document.addEventListener('click', this.closeOnBlur, true)
    }

    public componentWillUnmount(): void {
        document.removeEventListener('click', this.closeOnBlur, true)
    }

    private closeOnBlur = (e: Event) => {
        if (this.node && this.node.current && e.target && this.node.current.contains(e.target as Node)) {
            return
        }

        this.props.onClose()
    }

    render(): JSX.Element {
        const {position} = this.props

        return (
            <div
                className={'Modal ' + (position || 'bottom')}
                ref={this.node}
            >
                <div className='toolbar hideOnWidescreen'>
                    <IconButton
                        onClick={this.closeClicked}
                        icon={<CloseIcon/>}
                        title={'Close'}
                    />
                </div>
                {this.props.children}
            </div>
        )
    }

    private closeClicked = () => {
        this.props.onClose()
    }
}

export default injectIntl(Modal)
