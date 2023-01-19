// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './dialog.scss'
import ActionDialog from './actionDialog/actionDialog'

type Props = {
    children: React.ReactNode
    size?: string
    toolsMenu?: React.ReactNode // some dialogs may not  require a toolmenu
    toolbar?: React.ReactNode
    hideCloseButton?: boolean
    className?: string
    title?: JSX.Element
    subtitle?: JSX.Element
    onClose: () => void
}

const Dialog = (props: Props) => {
    // A dialog is just a ActionDialog without any footer action buttons
    return (
        <ActionDialog
            hideFooter={true}
            {...props}
        />
    )
}

export default React.memo(Dialog)
