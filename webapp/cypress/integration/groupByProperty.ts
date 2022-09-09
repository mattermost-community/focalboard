// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Group board by different properties', () => {
    beforeEach(() => {
        cy.apiInitServer()
        cy.apiResetBoards()
        cy.apiGetMe().then((userID) => cy.apiSkipTour(userID))
        localStorage.setItem('welcomePageViewed', 'true')
        localStorage.setItem('language', 'en')
    })

    it('MM-T4291 Group by different property', () => {
        cy.visit('/')

        // Create new board
        cy.uiCreateNewBoard('Testing')

        // Add a new group
        cy.uiAddNewGroup('Group 1')

        // Add a new card to the group
        cy.log('**Add a new card to the group**')
        cy.findAllByRole('button', {name: '+ New'}).eq(1).click()
        cy.findByRole('dialog').should('exist')
        cy.findByTestId('select-non-editable').findByText('Group 1').should('exist')
        cy.get('#mainBoardBody').findByText('Untitled').should('exist')

        // Add new select property
        cy.log('**Add new select property**')
        cy.findAllByRole('button', {name: '+ Add a property'}).click()
        cy.findAllByRole('button', {name: 'Select'}).click()
        cy.findByRole('textbox', {name: 'Select'}).type('{enter}')
        cy.findByRole('dialog').findByRole('button', {name: 'Select'}).should('exist')

        // Close card dialog
        cy.log('**Close card dialog**')
        cy.findByRole('button', {name: 'Close dialog'}).click()
        cy.findByRole('dialog').should('not.exist')

        // Group by new select property
        cy.log('**Group by new select property**')
        cy.findByRole('button', {name: /Group by:/}).click()
        cy.findByRole('button', {name: 'Status'}).get('.CheckIcon').should('exist')
        cy.findByRole('button', {name: 'Select'}).click()
        cy.findByTitle(/empty Select property/).contains('No Select')
        cy.get('#mainBoardBody').findByText('Untitled').should('exist')

        // Add another new group
        cy.log('**Add another new group**')
        cy.findByRole('button', {name: '+ Add a group'}).click()
        cy.findByRole('textbox', {name: 'New group'}).should('exist')

        // Add a new card to another group
        cy.log('**Add a new card to another group**')
        cy.findAllByRole('button', {name: '+ New'}).eq(1).click()
        cy.findByRole('dialog').should('exist')
        cy.findAllByTestId('select-non-editable').last().findByText('New group').should('exist')
    })
})
