import React from 'react'
import {IntlShape} from 'react-intl'

import {Card} from '../../blocks/card'
import {Board, IPropertyTemplate} from '../../blocks/board'

import CreatedTimeProperty from './createdTime/property'
import TextProperty from './text/property'
import EmailProperty from './email/property'
import PhoneProperty from './phone/property'
import NumberProperty from './number/property'
import UrlProperty from './url/property'
import SelectProperty from './select/property'

export type PropertyProps = {
    card: Card,
    board: Board,
    readOnly?: boolean,
    value?: string | string[],
    propertyTemplate?: IPropertyTemplate,
    extraData?: Record<string, string>,
    showEmptyPlaceholder?: boolean,
}

type PropertyType = {
    Editor: React.FunctionComponent<PropertyProps>,
    Value: React.FunctionComponent<PropertyProps>,
    name: string,
    type: string,
    displayName: (intl: IntlShape) => string,
}

class PropertiesRegistry {
    properties: {[key:string]: PropertyType} = {}
    propertiesList: PropertyType[] = []

    register(prop: PropertyType) {
        this.properties[prop.type] = prop
        this.propertiesList.push(prop)
    }

    unregister(prop: PropertyType) {
        delete(this.properties[prop.type])
        this.propertiesList = this.propertiesList.filter((p) => p.type == prop.type)
    }

    list() {
        return this.propertiesList
    }

    get(type: string) {
        return this.properties[type]
    }
}

const registry = new PropertiesRegistry()
// export const propertyTypesList: PropertyType[] = [
//     'multiSelect',
//     'date',
//     'person',
//     'checkbox',
//     'createdTime',
//     'createdBy',
//     'updatedTime',
//     'updatedBy',
// ]
registry.register(TextProperty)
registry.register(NumberProperty)
registry.register(EmailProperty)
registry.register(PhoneProperty)
registry.register(UrlProperty)
registry.register(CreatedTimeProperty)
registry.register(SelectProperty)

export default registry
