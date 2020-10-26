// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {IPropertyTemplate, PropertyType} from '../blocks/board'
import {BoardTree} from '../viewModel/boardTree'
import {Utils} from '../utils'
import mutator from '../mutator'

import Menu from '../widgets/menu'

import './propertyMenu.scss'

type Props = {
    property: IPropertyTemplate
    boardTree: BoardTree
}

type State = {
    name: string
}

export default class PropertyMenu extends React.Component<Props, State> {
    private nameTextbox = React.createRef<HTMLInputElement>()

    public shouldComponentUpdate(): boolean {
        return true
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            name: (this.props.property && this.props.property.name) || '',
        }
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

    private saveName = (): void => {
        if (this.state.name !== this.props.property.name) {
            Utils.log('menu.onNameChanged')
            mutator.renameProperty(this.props.boardTree.board, this.props.property.id, this.state.name)
        }
    }

    public render(): JSX.Element {
        const {boardTree, property} = this.props
        const {board} = boardTree
        return (
            <Menu>
                <input
                    ref={this.nameTextbox}
                    type='text'
                    className='PropertyMenu menu-textbox'
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => this.setState({name: e.target.value})}
                    value={this.state.name}
                    onBlur={this.saveName}
                    onKeyDown={(e) => {
                        if (e.keyCode === 13 || e.keyCode === 27) {
                            this.saveName()
                            e.stopPropagation()
                        }
                    }}
                />
                <Menu.SubMenu
                    id='type'
                    name={this.typeDisplayName(this.props.property.type)}
                >
                    <Menu.Text
                        id='text'
                        name='Text'
                        onClick={() => mutator.changePropertyType(board, property, 'text')}
                    />
                    <Menu.Text
                        id='number'
                        name='Number'
                        onClick={() => mutator.changePropertyType(board, property, 'number')}
                    />
                    <Menu.Text
                        id='select'
                        name='Select'
                        onClick={() => mutator.changePropertyType(board, property, 'select')}
                    />
                    <Menu.Text
                        id='createdTime'
                        name='Created Time'
                        onClick={() => mutator.changePropertyType(board, property, 'createdTime')}
                    />
                    <Menu.Text
                        id='updatedTime'
                        name='Updated Time'
                        onClick={() => mutator.changePropertyType(board, property, 'updatedTime')}
                    />
                </Menu.SubMenu>
                <Menu.Text
                    id='delete'
                    name='Delete'
                    onClick={() => mutator.deleteProperty(boardTree, property.id)}
                />
            </Menu>
        )
    }
}
