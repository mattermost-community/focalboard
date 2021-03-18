// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {PropertyType} from '../blocks/board'
import {Utils} from '../utils'
import Menu from '../widgets/menu'
import './propertyMenu.scss'

type Props = {
    propertyId: string
    propertyName: string
    propertyType: PropertyType
    onNameChanged: (newName: string) => void
    onTypeChanged: (newType: PropertyType) => void
    onDelete: (id: string) => void
    intl: IntlShape
}

type State = {
    name: string
}

class PropertyMenu extends React.PureComponent<Props, State> {
    private nameTextbox = React.createRef<HTMLInputElement>()

    constructor(props: Props) {
        super(props)
        this.state = {name: this.props.propertyName}
    }

    public componentDidMount(): void {
        this.nameTextbox.current?.focus()
        document.execCommand('selectAll', false, undefined)
    }

    private typeDisplayName(type: PropertyType): string {
        const {intl} = this.props

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
        case 'createdTime': return intl.formatMessage({id: 'PropertyType.CreatedTime', defaultMessage: 'Created Time'})
        case 'createdBy': return intl.formatMessage({id: 'PropertyType.CreatedBy', defaultMessage: 'Created By'})
        case 'updatedTime': return intl.formatMessage({id: 'PropertyType.UpdatedTime', defaultMessage: 'Updated Time'})
        case 'updatedBy': return intl.formatMessage({id: 'PropertyType.UpdatedBy', defaultMessage: 'Updated By'})
        default: {
            Utils.assertFailure(`typeDisplayName, unhandled type: ${type}`)
            return type
        }
        }
    }

    private typeMenuTitle(type: PropertyType): string {
        return `${this.props.intl.formatMessage({id: 'PropertyMenu.typeTitle', defaultMessage: 'Type'})}: ${this.typeDisplayName(type)}`
    }

    public render(): JSX.Element {
        return (
            <Menu>
                <input
                    ref={this.nameTextbox}
                    type='text'
                    className='PropertyMenu menu-textbox'
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => this.setState({name: e.target.value})}
                    value={this.state.name}
                    onBlur={() => this.props.onNameChanged(this.state.name)}
                    onKeyDown={(e) => {
                        if (e.keyCode === 13 || e.keyCode === 27) {
                            this.props.onNameChanged(this.state.name)
                            e.stopPropagation()
                        }
                    }}
                />
                <Menu.SubMenu
                    id='type'
                    name={this.typeMenuTitle(this.props.propertyType)}
                >
                    <Menu.Label>
                        <b>
                            {this.props.intl.formatMessage({id: 'PropertyMenu.changeType', defaultMessage: 'Change property type'})}
                        </b>
                    </Menu.Label>

                    <Menu.Separator/>

                    <Menu.Text
                        id='text'
                        name='Text'
                        onClick={() => this.props.onTypeChanged('text')}
                    />
                    <Menu.Text
                        id='number'
                        name='Number'
                        onClick={() => this.props.onTypeChanged('number')}
                    />
                    <Menu.Text
                        id='email'
                        name='Email'
                        onClick={() => this.props.onTypeChanged('email')}
                    />
                    <Menu.Text
                        id='select'
                        name='Select'
                        onClick={() => this.props.onTypeChanged('select')}
                    />
                    <Menu.Text
                        id='createdTime'
                        name='Created Time'
                        onClick={() => this.props.onTypeChanged('createdTime')}
                    />
                    <Menu.Text
                        id='updatedTime'
                        name='Updated Time'
                        onClick={() => this.props.onTypeChanged('updatedTime')}
                    />
                </Menu.SubMenu>
                <Menu.Text
                    id='delete'
                    name='Delete'
                    onClick={() => this.props.onDelete(this.props.propertyId)}
                />
            </Menu>
        )
    }
}

export default injectIntl(PropertyMenu)
