// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Create and delete board / card', () => {
    const timestamp = new Date().toLocaleString()
    const boardTitle = `Test Board (${timestamp})`
    const cardTitle = `Test Card (${timestamp})`

    beforeEach(() => {
        cy.apiInitServer()
        localStorage.setItem('welcomePageViewed', 'true')
    })

    it('MM-T4274 Create an Empty Board', () => {
        cy.visit('/')

        cy.contains('+ Add board').should('exist').click()

        // Tests for template selector
        cy.contains('Select a template').should('exist')

        // Some options are present
        cy.contains('Meeting Notes').should('exist')
        cy.contains('Personal Goals').should('exist')
        cy.contains('Project Tasks').should('exist')

        // Create empty board
        cy.contains('Empty board').should('exist').click()
        cy.get('.BoardComponent').should('exist')
        cy.get('.Editable.title').invoke('attr', 'placeholder').should('contain', 'Untitled board')

        // Change Title
        cy.get('.Editable.title').
            type('Testing').
            type('{enter}').
            should('have.value', 'Testing')
    })

    it('Can create and delete a board and a card', () => {
        cy.visit('/')

        // Create new empty board
        cy.log('**Create new empty board**')
        cy.contains('+ Add board').click({force: true})
        cy.contains('Empty board').click({force: true})
        cy.get('.BoardComponent').should('exist')

        // Change board title
        cy.log('**Change board title**')
        cy.get('.Editable.title').
            type(boardTitle).
            type('{enter}').
            should('have.value', boardTitle)

        // Hide and show the sidebar
        cy.log('**Hide and show the sidebar**')
        cy.get('.sidebarSwitcher').click()
        cy.get('.Sidebar .heading').should('not.exist')
        cy.get('.Sidebar .show-button').click()
        cy.get('.Sidebar .heading').should('exist')

        // Rename board view
        cy.log('**Rename board view**')
        const boardViewTitle = `Test board (${timestamp})`
        cy.get(".ViewHeader>.Editable[title='Board view']").should('exist')
        cy.get('.ViewHeader>.Editable').
            clear().
            type(boardViewTitle).
            type('{esc}')
        cy.get(`.ViewHeader .Editable[title='${boardViewTitle}']`).should('exist')

        // Create card
        cy.log('**Create card**')
        cy.get('.ViewHeader').contains('New').click()
        cy.get('.CardDetail').should('exist')

        // Change card title
        cy.log('**Change card title**')
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.get('.CardDetail .EditableArea.title').
            click().
            should('have.focus').
            wait(1000).
            type(cardTitle).
            should('have.value', cardTitle)

        // Close card dialog
        cy.log('**Close card dialog**')
        cy.get('.Dialog.dialog-back .wrapper').click({force: true})

        // Create a card by clicking on the + button
        cy.log('**Create a card by clicking on the + button**')
        cy.get('.KanbanColumnHeader .Button .AddIcon').click()
        cy.get('.CardDetail').should('exist')
        cy.get('.Dialog.dialog-back .wrapper').click({force: true})

        // Create table view
        cy.log('**Create table view**')
        cy.get('.ViewHeader').get('.DropdownIcon').first().parent().click()
        cy.get('.ViewHeader').contains('Add view').click()
        cy.get('.ViewHeader').contains('Add view').click()
        cy.get('.ViewHeader').
            contains('Add view').
            parent().
            contains('Table').
            click()
        cy.get(".ViewHeader .Editable[title='Table view']").should('exist')
        cy.get(`.TableRow [value='${cardTitle}']`).should('exist')

        // Rename table view
        cy.log('**Rename table view**')
        const tableViewTitle = `Test table (${timestamp})`
        cy.get(".ViewHeader .Editable[title='Table view']").
            clear().
            type(tableViewTitle).
            type('{esc}')
        cy.get(`.ViewHeader .Editable[title='${tableViewTitle}']`).should('exist')

        // Sort the table
        cy.log('**Sort the table**')
        cy.get('.ViewHeader').contains('Sort').click()
        cy.get('.ViewHeader').
            contains('Sort').
            parent().
            contains('Name').
            click()

        // Delete board
        cy.log('**Delete board**')
        cy.get('.Sidebar .octo-sidebar-list').
            contains(boardTitle).
            parent().
            next().
            find('.Button.IconButton').
            click({force: true})
        cy.contains('Delete board').click({force: true})
        cy.get('.DeleteBoardDialog button.danger').click({force: true})
        cy.contains(boardTitle).should('not.exist')
    })
})
