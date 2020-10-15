import { IPropertyTemplate, PropertyType } from "./blocks/board"
import { Menu } from "./menu"
import { Utils } from "./utils"

class PropertyMenu extends Menu {
	static shared = new PropertyMenu()

	property: IPropertyTemplate
	onNameChanged?: (name: string) => void

	private nameTextbox: HTMLElement

	constructor() {
		super()
		const typeMenuOptions = [
			{ id: "text", name: "Text" },
			{ id: "number", name: "Number" },
			{ id: "select", name: "Select" },
			{ id: "createdTime", name: "Created Time" },
			{ id: "updatedTime", name: "Updated Time" }
		]
		this.subMenuOptions.set("type", typeMenuOptions)
	}

	createMenuElement() {
		const menu = Utils.htmlToElement(`<div class="menu noselect" style="min-width: 200px;"></div>`)

		const ul = menu.appendChild(Utils.htmlToElement(`<ul class="menu-options"></ul>`))

		const nameTextbox = ul.appendChild(Utils.htmlToElement(`<li class="menu-textbox"></li>`))
		this.nameTextbox = nameTextbox
		let propertyValue = this.property ? this.property.name : ""
		nameTextbox.innerText = propertyValue
		nameTextbox.contentEditable = "true"
		nameTextbox.onclick = (e) => {
			e.stopPropagation()
		}
		nameTextbox.onblur = () => {
			if (nameTextbox.innerText !== propertyValue) {
				propertyValue = nameTextbox.innerText
				if (this.onNameChanged) {
					this.onNameChanged(nameTextbox.innerText)
				}
			}
		}
		nameTextbox.onmouseenter = () => {
			this.hideSubMenu()
		}
		nameTextbox.onkeydown = (e) => { if (e.keyCode === 13 || e.keyCode === 27) { nameTextbox.blur(); e.stopPropagation() } }

		ul.appendChild(Utils.htmlToElement(`<li class="menu-separator"></li>`))

		this.appendMenuOptions(ul)

		return menu
	}

	showAt(left: number, top: number) {
		this.options = [
			{ id: "type", name: this.typeDisplayName(this.property.type), type: "submenu" },
			{ id: "delete", name: "Delete" }
		]

		super.showAt(left, top)
		setTimeout(() => {
			this.nameTextbox.focus()
			document.execCommand("selectAll", false, null)
		}, 20)
	}

	private typeDisplayName(type: PropertyType): string {
		switch (type) {
			case "text": return "Text"
			case "number": return "Number"
			case "select": return "Select"
			case "multiSelect": return "Multi Select"
			case "person": return "Person"
			case "file": return "File or Media"
			case "checkbox": return "Checkbox"
			case "url": return "URL"
			case "email": return "Email"
			case "phone": return "Phone"
			case "createdTime": return "Created Time"
			case "createdBy": return "Created By"
			case "updatedTime": return "Updated Time"
			case "updatedBy": return "Updated By"
		}
		Utils.assertFailure(`typeDisplayName, unhandled type: ${type}`)
	}
}

export { PropertyMenu }
