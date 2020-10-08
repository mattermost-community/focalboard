import marked from "marked"

declare global {
	interface Window {
		msCrypto: Crypto
	}
}

class Utils {
	static createGuid() {
		const crypto = window.crypto || window.msCrypto
		function randomDigit() {
			if (crypto && crypto.getRandomValues) {
				const rands = new Uint8Array(1)
				crypto.getRandomValues(rands)
				return (rands[0] % 16).toString(16)
			}

			return (Math.floor((Math.random() * 16))).toString(16)
		}
		return "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, randomDigit)
	}

	static htmlToElement(html: string): HTMLElement {
		const template = document.createElement("template")
		html = html.trim()
		template.innerHTML = html
		return template.content.firstChild as HTMLElement
	}

	static getElementById(elementId: string): HTMLElement {
		const element = document.getElementById(elementId)
		Utils.assert(element, `getElementById "${elementId}$`)
		return element!
	}

	static htmlEncode(text: string) {
		return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
	}

	static htmlDecode(text: string) {
		return String(text).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"")
	}

	// Markdown

	static htmlFromMarkdown(text: string): string {
		// HACKHACK: Somehow, marked doesn't encode angle brackets
		const html = marked(text.replace(/</g, "&lt;"))
		return html
	}
	// Date and Time

	static displayDate(date: Date): string {
		const dateTimeFormat = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" })
		const text = dateTimeFormat.format(date)

		return text
	}

	static displayDateTime(date: Date): string {
		const dateTimeFormat = new Intl.DateTimeFormat(
			"en",
			{
				year: "numeric",
				month: "short",
				day: "2-digit",
				hour: 'numeric',
				minute: 'numeric',
			})
		const text = dateTimeFormat.format(date)
		return text
	}

	// Errors

	static assertValue(valueObject: any) {
		const name = Object.keys(valueObject)[0]
		const value = valueObject[name]
		if (!value) {
			Utils.logError(`ASSERT VALUE [${name}]`)
		}
	}

	static assert(condition: any, tag: string = "") {
		/// #!if ENV !== "production"
		if (!condition) {
			Utils.logError(`ASSERT [${tag ?? new Error().stack}]`)
		}
		/// #!endif
	}

	static assertFailure(tag: string = "") {
		/// #!if ENV !== "production"
		Utils.assert(false, tag)
		/// #!endif
	}

	static log(message: string) {
		/// #!if ENV !== "production"
		const timestamp = (Date.now() / 1000).toFixed(2)
		console.log(`[${timestamp}] ${message}`)
		/// #!endif
	}

	static logError(message: any) {
		/// #!if ENV !== "production"
		const timestamp = (Date.now() / 1000).toFixed(2)
		console.error(`[${timestamp}] ${message}`)
		/// #!endif
	}

	// favicon

	static setFavicon(icon?: string) {
		const href = icon ?
			`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`
			: ""
		const link = (document.querySelector("link[rel*='icon']") || document.createElement('link')) as HTMLLinkElement
		link.type = "image/x-icon"
		link.rel = "shortcut icon"
		link.href = href
		document.getElementsByTagName("head")[0].appendChild(link)
	}

	// File names

	static sanitizeFilename(filename: string) {
		// TODO: Use an industrial-strength sanitizer
		let sanitizedFilename = filename
		const illegalCharacters = ["\\", "/", "?", ":", "<", ">", "*", "|", "\"", "."]
		illegalCharacters.forEach(character => { sanitizedFilename = sanitizedFilename.replace(character, "") })
		return sanitizedFilename
	}

	// File picker

	static selectLocalFile(onSelect?: (file: File) => void, accept = ".jpg,.jpeg,.png"): void {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = accept
		input.onchange = async () => {
			const file = input.files![0]
			onSelect?.(file)
		}

		input.style.display = "none"
		document.body.appendChild(input)
		input.click()

		// TODO: Remove or reuse input
	}

	// Arrays

	static arraysEqual(a: any[], b: any[]) {
		if (a === b) { return true }
		if (a === null || b === null) { return false }
		if (a === undefined || b === undefined) { return false }
		if (a.length !== b.length) { return false }

		for (let i = 0; i < a.length; ++i) {
			if (a[i] !== b[i]) return false
		}
		return true
	}
}

export { Utils }
