import React from 'react';

type MenuOptionProps = {
	id: string,
	name: string,
    onClick?: (id: string) => void,
}

function SeparatorOption() {
    return (<div className="MenuOption MenuSeparator menu-separator"></div>)
}

type SubMenuOptionProps = MenuOptionProps & {
}

type SubMenuState = {
    isOpen: boolean;
}

class SubMenuOption extends React.Component<SubMenuOptionProps, SubMenuState> {
    state = {
        isOpen: false
    }

    handleMouseEnter = () => {
        this.setState({isOpen: true});
    }

    close = () => {
        this.setState({isOpen: false});
    }

    render() {
        return (
            <div
                className='MenuOption SubMenuOption menu-option'
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.close}
            >
                <div className='name menu-name'>{this.props.name}</div>
                <div className="imageSubmenuTriangle" style={{float: 'right'}}></div>
                {this.state.isOpen &&
                    <Menu onClose={this.close}>
                        {this.props.children}
                    </Menu>
                }
            </div>
        )
    }
}

type ColorOptionProps = MenuOptionProps & {
	icon?: "checked" | "sortUp" | "sortDown" | undefined,
}

class ColorOption extends React.Component<ColorOptionProps> {
    render() {
        const {name, icon} = this.props;
        return (
            <div className='MenuOption ColorOption menu-option'>
                <div className='name'>{name}</div>
                {icon && <div className={'icon ' + icon}></div>}
                <div className='menu-colorbox'></div>
            </div>
        )
    }
}

type SwitchOptionProps = MenuOptionProps & {
	isOn: boolean,
	icon?: "checked" | "sortUp" | "sortDown" | undefined,
}

class SwitchOption extends React.Component<SwitchOptionProps> {
    handleOnClick = () => {
        this.props.onClick(this.props.id)
    }
    render() {
        const {name, icon, isOn} = this.props;
        return (
            <div className='MenuOption SwitchOption menu-option'>
                <div className='name'>{name}</div>
                {icon && <div className={`icon ${icon}`}></div>}
                <div className={isOn ? "octo-switch on" : "octo-switch"}>
                    <div
                        className="octo-switch-inner"
                        onClick={this.handleOnClick}
                    ></div>
                </div>
            </div>
        );
    }
}

type TextOptionProps = MenuOptionProps & {
	icon?: "checked" | "sortUp" | "sortDown" | undefined,
}
class TextOption extends React.Component<TextOptionProps> {
    handleOnClick = () => {
        this.props.onClick(this.props.id)
    }

    render() {
        const {name, icon} = this.props;
        return (
            <div className='MenuOption TextOption menu-option' onClick={this.handleOnClick}>
                <div className='name'>{name}</div>
                {icon && <div className={`icon ${icon}`}></div>}
            </div>
        );
    }
}

type MenuProps = {
    children: React.ReactNode
    onClose: () => void
}

export default class Menu extends React.Component<MenuProps> {
    static Color = ColorOption
    static SubMenu = SubMenuOption
    static Switch = SwitchOption
    static Separator = SeparatorOption
    static Text = TextOption

    onBodyClick = (e: MouseEvent) => {
        this.props.onClose()
    }

    onBodyKeyDown = (e: KeyboardEvent) => {
        // Ignore keydown events on other elements
        if (e.target !== document.body) { return }
        if (e.keyCode === 27) {
            // ESC
            this.props.onClose()
            e.stopPropagation()
        }
    }

    componentDidMount() {
        document.addEventListener("click", this.onBodyClick)
        document.addEventListener("keydown", this.onBodyKeyDown)
    }

    componentWillUnmount() {
        document.removeEventListener("click", this.onBodyClick)
        document.removeEventListener("keydown", this.onBodyKeyDown)
    }

    render() {
        return (
            <div className="Menu menu noselect">
                <div className="menu-options">
                    {this.props.children}
                </div>
            </div>
        )
    }
}
