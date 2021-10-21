// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Utils} from '../../utils'

import {IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import Button from '../../widgets/buttons/button'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import CheckIcon from '../../widgets/icons/check'

type Props = {
    properties: readonly IPropertyTemplate[]
    activeView: BoardView
    dateDisplayPropertyName?: string
}

const ViewHeaderDisplayByMenu = React.memo((props: Props) => {
    const {properties, activeView, dateDisplayPropertyName} = props

    return (
        <MenuWrapper>
            <Button>
                <FormattedMessage
                    id='ViewHeader.display-by'
                    defaultMessage='Display by: {property}'
                    values={{
                        property: (
                            <span
                                style={{color: 'rgb(var(--center-channel-color-rgb))'}}
                                id='displayByLabel'
                            >
                                {dateDisplayPropertyName}
                            </span>
                        ),
                    }}
                />
            </Button>
            <Menu>
                {properties?.filter((o: IPropertyTemplate) => o.type === 'date' || o.type === 'createdTime' || o.type === 'updatedTime').map((date: IPropertyTemplate) => (
                    <Menu.Text
                        key={date.id}
                        id={date.id}
                        name={date.name}
                        rightIcon={activeView.fields.dateDisplayPropertyId === date.id ? <CheckIcon/> : undefined}
                        onClick={(id) => {
                            if (activeView.fields.dateDisplayPropertyId === id) {
                                return
                            }

                            mutator.changeViewDateDisplayPropertyId(activeView.id, activeView.fields.dateDisplayPropertyId, id)
                        }}
                    />
                ))}
            </Menu>
        </MenuWrapper>
    )
})

export default ViewHeaderDisplayByMenu
