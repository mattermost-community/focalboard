// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {FormattedMessage} from 'react-intl'

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
    groupByPropertyName?: string
}

const ViewHeaderGroupByMenu = React.memo((props: Props) => {
    const {properties, activeView, groupByPropertyName} = props
    return (
        <MenuWrapper>
            <Button>
                <FormattedMessage
                    id='ViewHeader.group-by'
                    defaultMessage='Group by: {property}'
                    values={{
                        property: (
                            <span
                                style={{color: 'rgb(var(--main-fg))'}}
                                id='groupByLabel'
                            >
                                {groupByPropertyName}
                            </span>
                        ),
                    }}
                />
            </Button>
            <Menu>
                {properties.filter((o: IPropertyTemplate) => o.type === 'select').map((option: IPropertyTemplate) => (
                    <Menu.Text
                        key={option.id}
                        id={option.id}
                        name={option.name}
                        rightIcon={activeView.groupById === option.id ? <CheckIcon/> : undefined}
                        onClick={(id) => {
                            if (activeView.groupById === id) {
                                return
                            }

                            mutator.changeViewGroupById(activeView, id)
                        }}
                    />
                ))}
            </Menu>
        </MenuWrapper>
    )
})

export default ViewHeaderGroupByMenu
