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

type Props = {
    properties: readonly IPropertyTemplate[]
    activeView: BoardView
}
const ViewHeaderPropertiesMenu = React.memo((props: Props) => {
    const {properties, activeView} = props
    return (
        <MenuWrapper>
            <Button>
                <FormattedMessage
                    id='ViewHeader.properties'
                    defaultMessage='Properties'
                />
            </Button>
            <Menu>
                {properties.map((option: IPropertyTemplate) => (
                    <Menu.Switch
                        key={option.id}
                        id={option.id}
                        name={option.name}
                        isOn={activeView.visiblePropertyIds.includes(option.id)}
                        onClick={(propertyId: string) => {
                            let newVisiblePropertyIds = []
                            if (activeView.visiblePropertyIds.includes(propertyId)) {
                                newVisiblePropertyIds = activeView.visiblePropertyIds.filter((o: string) => o !== propertyId)
                            } else {
                                newVisiblePropertyIds = [...activeView.visiblePropertyIds, propertyId]
                            }
                            mutator.changeViewVisibleProperties(activeView, newVisiblePropertyIds)
                        }}
                    />
                ))}
            </Menu>
        </MenuWrapper>
    )
})

export default ViewHeaderPropertiesMenu
