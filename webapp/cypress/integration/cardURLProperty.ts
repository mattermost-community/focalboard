// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Card URL Property', () => {
    beforeEach(() => {
        cy.apiInitServer()
        cy.apiResetBoards()
        cy.apiGetMe().then((userID) => cy.apiSkipTour(userID))
        localStorage.setItem('welcomePageViewed', 'true')
        localStorage.setItem('language', 'en')
    })

    const url = 'https://mattermost.com'
    const changedURL = 'https://mattermost.com/blog'

    it('Allows to create and edit URL property', () => {
        cy.visit('/')

        // Create new board
        cy.uiCreateNewBoard('Testing')

        // Add a new card
        cy.uiAddNewCard('Card')

        // Add URL property
        cy.log('**Add URL property**')
        cy.findByRole('button', {name: '+ Add a property'}).click()
        cy.findByRole('button', {name: 'URL'}).click()
        cy.findByRole('textbox', {name: 'URL'}).type('{enter}')

        // Enter URL
        cy.log('**Enter URL**')
        cy.findByPlaceholderText('Empty').type(`${url}{enter}`)

        // Check buttons
        cy.log('**Check buttons**')
        cy.findByRole('link', {name: url}).realHover()
        cy.findByRole('button', {name: 'Edit'}).should('exist')
        cy.findByRole('button', {name: 'Copy'}).should('exist')

        // Change URL
        cy.log('**Change URL**')
        cy.findByRole('link', {name: url}).realHover()
        cy.findByRole('button', {name: 'Edit'}).click()
        cy.findByRole('textbox', {name: url}).clear().type(`${changedURL}{enter}`)
        cy.findByRole('link', {name: changedURL}).should('exist')

        // Close card dialog
        cy.log('**Close card dialog**')
        cy.findByRole('button', {name: 'Close dialog'}).click()
        cy.findByRole('dialog').should('not.exist')

        // Show URL property
        showURLProperty()

        // Copy URL to clipboard
        cy.log('**Copy URL to clipboard**')
        cy.document().then((doc) => cy.spy(doc, 'execCommand')).as('exec')
        cy.findByRole('link', {name: changedURL}).realHover()
        cy.findByRole('button', {name: 'Edit'}).should('not.exist')
        cy.findByRole('button', {name: 'Copy'}).click()
        cy.findByText('Copied!').should('exist')
        cy.findByText('Copied!').should('not.exist')
        cy.get('@exec').should('have.been.calledOnceWith', 'copy')

        // Add table view
        addView('Table')

        // Check buttons
        cy.log('**Check buttons**')
        cy.findByRole('link', {name: changedURL}).realHover()
        cy.findByRole('button', {name: 'Edit'}).should('exist')
        cy.findByRole('button', {name: 'Copy'}).should('not.exist')

        // Add gallery view
        addView('Gallery')
        showURLProperty()

        // Check buttons
        cy.log('**Check buttons**')
        cy.findByRole('link', {name: changedURL}).realHover()
        cy.findByRole('button', {name: 'Edit'}).should('not.exist')
        cy.findByRole('button', {name: 'Copy'}).should('exist')

        // Add calendar view
        addView('Calendar')
        showURLProperty()

        // Check buttons
        cy.log('**Check buttons**')
        cy.findByRole('link', {name: changedURL}).realHover()
        cy.findByRole('button', {name: 'Edit'}).should('not.exist')
        cy.findByRole('button', {name: 'Copy'}).should('exist')
    })

    type ViewType = 'Board' | 'Table' | 'Gallery' | 'Calendar'

    const addView = (type: ViewType) => {
        cy.log(`**Add ${type} view**`)

        cy.findByRole('button', {name: 'View menu'}).click()
        cy.findByText('Add view').realHover()
        cy.findByRole('button', {name: type}).click()
        cy.findByRole('textbox', {name: `${type} view`}).should('exist')
    }

    const showURLProperty = () => {
        cy.log('**Show URL property**')
        cy.findByRole('button', {name: 'Properties'}).click()
        cy.findByRole('button', {name: 'URL'}).click()
        cy.findByRole('link', {name: changedURL}).should('exist')
    }
})
