// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {Board} from "../blocks/board"

import Dialog, {DialogProps} from "./dialog"

export type CardViewProps = DialogProps & {
    board: Board
}

const DialogCardView = (props: CardViewProps): JSX.Element => {
    return (<Dialog {...props}/>)
}

export default DialogCardView
