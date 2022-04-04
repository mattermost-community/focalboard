// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl, IntlShape} from 'react-intl'

import {PropertyType} from '../blocks/board'
import {Utils} from '../utils'
import Menu from '../widgets/menu'
import './propertyMenu.scss'

type Props = {
    propertyId: string
    propertyName: string
    propertyType: PropertyType
    onTypeAndNameChanged: (newType: PropertyType, newName: string) => void
    onDelete: (id: string) => void
}

export function typeDisplayName(intl: IntlShape, type: PropertyType): string {
    switch (type) {
    case 'text': return intl.formatMessage({id: 'PropertyType.Text', defaultMessage: 'Text'})
    case 'number': return intl.formatMessage({id: 'PropertyType.Number', defaultMessage: 'Number'})
    case 'select': return intl.formatMessage({id: 'PropertyType.Select', defaultMessage: 'Select'})
    case 'multiSelect': return intl.formatMessage({id: 'PropertyType.MultiSelect', defaultMessage: 'Multi Select'})
    case 'person': return intl.formatMessage({id: 'PropertyType.Person', defaultMessage: 'Person'})
    case 'file': return intl.formatMessage({id: 'PropertyType.File', defaultMessage: 'File or Media'})
    case 'checkbox': return intl.formatMessage({id: 'PropertyType.Checkbox', defaultMessage: 'Checkbox'})
    case 'url': return intl.formatMessage({id: 'PropertyType.URL', defaultMessage: 'URL'})
    case 'email': return intl.formatMessage({id: 'PropertyType.Email', defaultMessage: 'Email'})
    case 'phone': return intl.formatMessage({id: 'PropertyType.Phone', defaultMessage: 'Phone'})
    case 'createdTime': return intl.formatMessage({id: 'PropertyType.CreatedTime', defaultMessage: 'Created time'})
    case 'createdBy': return intl.formatMessage({id: 'PropertyType.CreatedBy', defaultMessage: 'Created by'})
    case 'updatedTime': return intl.formatMessage({id: 'PropertyType.UpdatedTime', defaultMessage: 'Last updated time'})
    case 'updatedBy': return intl.formatMessage({id: 'PropertyType.UpdatedBy', defaultMessage: 'Last updated by'})
    case 'date': return intl.formatMessage({id: 'PropertyType.Date', defaultMessage: 'Date'})
    default: {
        Utils.assertFailure(`typeDisplayName, unhandled type: ${type}`)
        return type
    }
    }
}
function typeMenuTitle(intl: IntlShape, type: PropertyType): string {
    return `${intl.formatMessage({id: 'PropertyMenu.typeTitle', defaultMessage: 'Type'})}: ${typeDisplayName(intl, type)}`
}

export const propertyTypesList: PropertyType[] = [
    'text',
    'number',
    'email',
    'phone',
    'url',
    'select',
    'multiSelect',
    'date',
    'person',
    'checkbox',
    'createdTime',
    'createdBy',
    'updatedTime',
    'updatedBy',
]

type TypesProps = {
    label: string
    onTypeSelected: (type: PropertyType) => void
}

export const PropertyTypes = (props: TypesProps): JSX.Element => {
    const intl = useIntl()
    return (
        <>
            <Menu.Label>
                <b>{props.label}</b>
            </Menu.Label>

            <Menu.Separator/>

            {
                propertyTypesList.map((type) => (
                    <Menu.Text
                        key={type}
                        id={type}
                        name={typeDisplayName(intl, type)}
                        onClick={() => props.onTypeSelected(type)}
                    />
                ))
            }
        </>
    )
}

const PropertyMenu = (props: Props) => {
    const intl = useIntl()

    const deleteText = intl.formatMessage({
        id: 'PropertyMenu.Delete',
        defaultMessage: 'Delete',
    })

    return (
        <Menu>
            <Menu.TextInput
                initialValue={props.propertyName}
                onValueChanged={(n) => props.onTypeAndNameChanged(props.propertyType, n)}
            />
            <Menu.SubMenu
                id='type'
                name={typeMenuTitle(intl, props.propertyType)}
            >
                <PropertyTypes
                    label={intl.formatMessage({id: 'PropertyMenu.changeType', defaultMessage: 'Change property type'})}
                    onTypeSelected={(type: PropertyType) => props.onTypeAndNameChanged(type, props.propertyName)}
                />
            </Menu.SubMenu>
            <Menu.Text
                id='delete'
                name={deleteText}
                onClick={() => props.onDelete(props.propertyId)}
            />
        </Menu>
    )
}

export default React.memo(PropertyMenu)
