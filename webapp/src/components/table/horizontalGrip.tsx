// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useDrag} from 'react-dnd'

import './horizontalGrip.scss'

type Props = {
    templateId: string
    columnWidth: number
    onAutoSizeColumn: (columnID: string) => void;
}

const HorizontalGrip = (props: Props): JSX.Element => {
    const {templateId, columnWidth, onAutoSizeColumn} = props
    const [, drag] = useDrag(() => ({
        type: 'horizontalGrip',
        item: {
            id: templateId,
            width: columnWidth,
        },
    }), [templateId, columnWidth])

    return (
        <div
            ref={drag}
            className='HorizontalGrip'
            onDoubleClick={() => onAutoSizeColumn(templateId)}
        />
    )
}

export default React.memo(HorizontalGrip)
