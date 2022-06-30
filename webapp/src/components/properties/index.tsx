import {PropertyTypeEnum} from '../../blocks/board'

import CreatedTimeProperty from './createdTime/property'
import CreatedByProperty from './createdBy/property'
import UpdatedTimeProperty from './updatedTime/property'
import UpdatedByProperty from './updatedBy/property'
import TextProperty from './text/property'
import EmailProperty from './email/property'
import PhoneProperty from './phone/property'
import NumberProperty from './number/property'
import UrlProperty from './url/property'
import SelectProperty from './select/property'
import MultiSelectProperty from './multiselect/property'
import DateProperty from './date/property'
import PersonProperty from './person/property'
import CheckboxProperty from './checkbox/property'
import UnknownProperty from './unknown/property'

import {PropertyType} from './types'

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

    get(type: PropertyTypeEnum) {
        return this.properties[type] || UnknownProperty
    }
}

const registry = new PropertiesRegistry()
registry.register(TextProperty)
registry.register(NumberProperty)
registry.register(EmailProperty)
registry.register(PhoneProperty)
registry.register(UrlProperty)
registry.register(SelectProperty)
registry.register(MultiSelectProperty)
registry.register(DateProperty)
registry.register(PersonProperty)
registry.register(CheckboxProperty)
registry.register(CreatedByProperty)
registry.register(CreatedTimeProperty)
registry.register(UpdatedByProperty)
registry.register(UpdatedTimeProperty)

export default registry
