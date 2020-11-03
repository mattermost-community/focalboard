// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {PropertyType} from '../blocks/board'
import {Utils} from '../utils'

import Menu from '../widgets/menu'

import './propertyMenu.scss'

type Props = {
    propertyId: string
    propertyName: string
    propertyType: PropertyType
    onNameChanged: (newName: string) => void
    onTypeChanged: (newType: string) => void
    onDelete: (id: string) => void
}

type State = {
    name: string
}

export default class PropertyMenu extends React.PureComponent<Props, State> {
    private nameTextbox = React.createRef<HTMLInputElement>()

    public shouldComponentUpdate(): boolean {
        return true
    }

    constructor(props: Props) {
        super(props)
        this.state = {name: this.props.propertyName}
    }

    public componentDidMount(): void {
        this.nameTextbox.current.focus()
        document.execCommand('selectAll', false, null)
    }

    private typeDisplayName(type: PropertyType): string {
        switch (type) {
        case 'text': return 'Text'
        case 'number': return 'Number'
        case 'select': return 'Select'
        case 'multiSelect': return 'Multi Select'
        case 'person': return 'Person'
        case 'file': return 'File or Media'
        case 'checkbox': return 'Checkbox'
        case 'url': return 'URL'
        case 'email': return 'Email'
        case 'phone': return 'Phone'
        case 'createdTime': return 'Created Time'
        case 'createdBy': return 'Created By'
        case 'updatedTime': return 'Updated Time'
        case 'updatedBy': return 'Updated By'
        default: {
            Utils.assertFailure(`typeDisplayName, unhandled type: ${type}`)
            return type
        }
        }
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
                    name={this.typeDisplayName(this.props.propertyType)}
                >
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
