class FlashMessage {
	//
	// Show a temporary status message
	//
	static show(text: string, delay: number = 800) {
		const flashPanel = document.createElement("div")
		flashPanel.innerText = text
		flashPanel.classList.add("flashPanel")
		flashPanel.classList.add("flashIn")

		document.body.appendChild(flashPanel)

		setTimeout(() => {
			flashPanel.classList.remove("flashIn")
			flashPanel.classList.add("flashOut")
			setTimeout(() => {
				document.body.removeChild(flashPanel)
			}, 300)
		}, delay)
	}
}

export { FlashMessage }
