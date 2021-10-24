// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useRef, useEffect} from 'react'
import debounce from 'lodash/debounce'
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

function typeDisplayName(intl: IntlShape, type: PropertyType): string {
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

const PropertyMenu = React.memo((props: Props) => {
    const intl = useIntl()
    const nameTextbox = useRef<HTMLInputElement>(null)
    const [name, setName] = useState(props.propertyName)

    const deleteText = intl.formatMessage({
        id: 'PropertyMenu.Delete',
        defaultMessage: 'Delete',
    })

    const debouncedOnTypeAndNameChanged = (newType: PropertyType) => debounce(() => props.onTypeAndNameChanged(newType, name), 150)

    useEffect(() => {
        nameTextbox.current?.focus()
        nameTextbox.current?.setSelectionRange(0, name.length)
    }, [])

    const propertyTypes = [
        {type: 'text'},
        {type: 'number'},
        {type: 'email'},
        {type: 'phone'},
        {type: 'url'},
        {type: 'select'},
        {type: 'multiSelect'},
        {type: 'date'},
        {type: 'person'},
        {type: 'checkbox'},
        {type: 'createdTime'},
        {type: 'createdBy'},
        {type: 'updatedTime'},
        {type: 'updatedBy'},
    ]

    return (
        <Menu>
            <input
                ref={nameTextbox}
                type='text'
                className='PropertyMenu menu-textbox'
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setName(e.target.value)}
                value={name}
                onBlur={() => props.onTypeAndNameChanged(props.propertyType, name)}
                onKeyDown={(e) => {
                    if (e.keyCode === 13 || e.keyCode === 27) {
                        props.onTypeAndNameChanged(props.propertyType, name)
                        e.stopPropagation()
                    }
                }}
                spellCheck={true}
            />
            <Menu.SubMenu
                id='type'
                name={typeMenuTitle(intl, props.propertyType)}
            >
                <Menu.Label>
                    <b>
                        {intl.formatMessage({id: 'PropertyMenu.changeType', defaultMessage: 'Change property type'})}
                    </b>
                </Menu.Label>

                <Menu.Separator/>

                {
                    propertyTypes.map((propertyType) => (
                        <Menu.Text
                            key={propertyType.type}
                            id={propertyType.type}
                            name={typeDisplayName(intl, propertyType.type as PropertyType)}
                            onClick={() => debouncedOnTypeAndNameChanged(propertyType.type as PropertyType)()}
                        />
                    ))
                }
            </Menu.SubMenu>
            <Menu.Text
                id='delete'
                name={deleteText}
                onClick={() => props.onDelete(props.propertyId)}
            />
        </Menu>
    )
})

export default PropertyMenu
