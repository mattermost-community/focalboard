// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Utils} from './utils'

type MenuOption = {
    id: string,
    name: string,
    isOn?: boolean,
    icon?: 'checked' | 'sortUp' | 'sortDown' | undefined,
    type?: 'separator' | 'color' | 'submenu' | 'switch' | undefined
}

// Menu is a pop-over context menu system
class Menu {
    static shared = new Menu()

    options: MenuOption[] = []
    readonly subMenuOptions: Map<string, MenuOption[]> = new Map()
    onMenuClicked?: (optionId: string, type?: string) => void
    onMenuToggled?: (optionId: string, isOn: boolean) => void

    private menu?: HTMLElement
    private subMenu?: Menu
    private onBodyClick?: () => void
    private onBodyKeyDown?: (e: KeyboardEvent) => void

    get view(): HTMLElement {
        return this.menu
    }

    get isVisible(): boolean {
        return (this.menu !== undefined)
    }

    createMenuElement(): HTMLElement {
        const menu = Utils.htmlToElement('<div class="menu noselect"></div>')
        const menuElement = menu.appendChild(Utils.htmlToElement('<div class="menu-options"></div>'))
        this.appendMenuOptions(menuElement)

        return menu
    }

    appendMenuOptions(menuElement: HTMLElement): void {
        for (const option of this.options) {
            if (option.type === 'separator') {
                menuElement.appendChild(Utils.htmlToElement('<div class="menu-separator"></div>'))
            } else {
                const optionElement = menuElement.appendChild(Utils.htmlToElement('<div class="menu-option"></div>'))
                optionElement.id = option.id
                const nameElement = optionElement.appendChild(Utils.htmlToElement('<div class="menu-name"></div>'))
                nameElement.innerText = option.name
                if (option.type === 'submenu') {
                    optionElement.appendChild(Utils.htmlToElement('<div class="imageSubmenuTriangle" style="float: right;"></div>'))
                    optionElement.onmouseenter = () => {
                        // Calculate offset taking window scroll into account
                        const bodyRect = document.body.getBoundingClientRect()
                        const rect = optionElement.getBoundingClientRect()
                        this.showSubMenu(rect.right - bodyRect.left, rect.top - bodyRect.top, option.id)
                    }
                } else {
                    if (option.icon) {
                        let iconName: string
                        switch (option.icon) {
                        case 'checked': {
                            iconName = 'imageMenuCheck'
                            break
                        }
                        case 'sortUp': {
                            iconName = 'imageMenuSortUp'
                            break
                        }
                        case 'sortDown': {
                            iconName = 'imageMenuSortDown'
                            break
                        }
                        default: {
                            Utils.assertFailure(`Unsupported menu icon: ${option.icon}`)
                        }
                        }
                        if (iconName) {
                            optionElement.appendChild(Utils.htmlToElement(`<div class="${iconName}" style="float: right;"></div>`))
                        }
                    }

                    optionElement.onmouseenter = () => {
                        this.hideSubMenu()
                    }
                    optionElement.onclick = (e) => {
                        if (this.onMenuClicked) {
                            this.onMenuClicked(option.id, option.type)
                        }
                        this.hide()
                        e.stopPropagation()
                        return false
                    }
                }

                if (option.type === 'color') {
                    const colorbox = optionElement.insertBefore(Utils.htmlToElement('<div class="menu-colorbox"></div>'), optionElement.firstChild)
                    colorbox.classList.add(option.id) // id is the css class name for the color
                } else if (option.type === 'switch') {
                    const className = option.isOn ? 'octo-switch on' : 'octo-switch'
                    const switchElement = optionElement.appendChild(Utils.htmlToElement(`<div class="${className}"></div>`))
                    switchElement.appendChild(Utils.htmlToElement('<div class="octo-switch-inner"></div>'))
                    switchElement.onclick = (e) => {
                        const isOn = switchElement.classList.contains('on')
                        if (isOn) {
                            switchElement.classList.remove('on')
                        } else {
                            switchElement.classList.add('on')
                        }

                        if (this.onMenuToggled) {
                            this.onMenuToggled(option.id, !isOn)
                        }
                        e.stopPropagation()
                        return false
                    }
                    optionElement.onclick = null
                }
            }
        }
    }

    showAtElement(element: HTMLElement): void {
        const bodyRect = document.body.getBoundingClientRect()
        const rect = element.getBoundingClientRect()

        // Show at bottom-left of element
        this.showAt(rect.left - bodyRect.left, rect.bottom - bodyRect.top)
    }

    showAt(pageX: number, pageY: number): void {
        if (this.menu) {
            this.hide()
        }
        this.menu = this.createMenuElement()
        this.menu.style.left = `${pageX}px`
        this.menu.style.top = `${pageY}px`

        document.body.appendChild(this.menu)

        this.onBodyClick = () => {
            Utils.log('onBodyClick')
            this.hide()
        }

        this.onBodyKeyDown = (e: KeyboardEvent) => {
            Utils.log(`onBodyKeyDown, target: ${e.target}`)

            // Ignore keydown events on other elements
            if (e.target !== document.body) {
                return
            }
            if (e.keyCode === 27) {
                // ESC
                this.hide()
                e.stopPropagation()
            }
        }

        setTimeout(() => {
            document.body.addEventListener('click', this.onBodyClick)
            document.body.addEventListener('keydown', this.onBodyKeyDown)
        }, 20)
    }

    hide(): void {
        if (!this.menu) {
            return
        }

        this.hideSubMenu()

        document.body.removeChild(this.menu)
        this.menu = undefined

        document.body.removeEventListener('click', this.onBodyClick)
        this.onBodyClick = undefined

        document.body.removeEventListener('keydown', this.onBodyKeyDown)
        this.onBodyKeyDown = undefined
    }

    hideSubMenu(): void {
        if (this.subMenu) {
            this.subMenu.hide()
            this.subMenu = undefined
        }
    }

    private showSubMenu(pageX: number, pageY: number, id: string): void {
        Utils.log(`showSubMenu: ${id}`)
        const options: MenuOption[] = this.subMenuOptions.get(id) || []

        if (this.subMenu) {
            if (this.subMenu.options === options) {
                // Already showing the sub menu
                return
            }

            this.subMenu.hide()
        }

        this.subMenu = new Menu()

        this.subMenu.onMenuClicked = (optionId: string, type?: string) => {
            const subMenuId = `${id}-${optionId}`
            if (this.onMenuClicked) {
                this.onMenuClicked(subMenuId, type)
            }
            this.hide()
        }

        this.subMenu.options = options
        this.subMenu.showAt(pageX, pageY)
    }
}

export {Menu, MenuOption}
