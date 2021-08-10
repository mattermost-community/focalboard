// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Constants} from '../../constants'
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
    const intl = useIntl()
    return (
        <MenuWrapper>
            <Button>
                <FormattedMessage
                    id='ViewHeader.properties'
                    defaultMessage='Properties'
                />
            </Button>
            <Menu>
                {activeView.fields.viewType === 'gallery' &&
                    <Menu.Switch
                        key={Constants.titleColumnId}
                        id={Constants.titleColumnId}
                        name={intl.formatMessage({id: 'default-properties.title', defaultMessage: 'Title'})}
                        isOn={activeView.fields.visiblePropertyIds.includes(Constants.titleColumnId)}
                        onClick={(propertyId: string) => {
                            let newVisiblePropertyIds = []
                            if (activeView.fields.visiblePropertyIds.includes(propertyId)) {
                                newVisiblePropertyIds = activeView.fields.visiblePropertyIds.filter((o: string) => o !== propertyId)
                            } else {
                                newVisiblePropertyIds = [...activeView.fields.visiblePropertyIds, propertyId]
                            }
                            mutator.changeViewVisibleProperties(activeView.id, activeView.fields.visiblePropertyIds, newVisiblePropertyIds)
                        }}
                    />}
                {properties?.map((option: IPropertyTemplate) => (
                    <Menu.Switch
                        key={option.id}
                        id={option.id}
                        name={option.name}
                        isOn={activeView.fields.visiblePropertyIds.includes(option.id)}
                        onClick={(propertyId: string) => {
                            let newVisiblePropertyIds = []
                            if (activeView.fields.visiblePropertyIds.includes(propertyId)) {
                                newVisiblePropertyIds = activeView.fields.visiblePropertyIds.filter((o: string) => o !== propertyId)
                            } else {
                                newVisiblePropertyIds = [...activeView.fields.visiblePropertyIds, propertyId]
                            }
                            mutator.changeViewVisibleProperties(activeView.id, activeView.fields.visiblePropertyIds, newVisiblePropertyIds)
                        }}
                    />
                ))}
            </Menu>
        </MenuWrapper>
    )
})

export default ViewHeaderPropertiesMenu
