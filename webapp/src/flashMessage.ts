// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
class FlashMessage {
    //
    // Show a temporary status message
    //
    static show(text: string, delay = 800): void {
        const flashPanel = document.createElement('div')
        flashPanel.innerText = text
        flashPanel.classList.add('flashPanel')
        flashPanel.classList.add('flashIn')

        document.body.appendChild(flashPanel)

        setTimeout(() => {
            flashPanel.classList.remove('flashIn')
            flashPanel.classList.add('flashOut')
            setTimeout(() => {
                document.body.removeChild(flashPanel)
            }, 300)
        }, delay)
    }
}

export {FlashMessage}
