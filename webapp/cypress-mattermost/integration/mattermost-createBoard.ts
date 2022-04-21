// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Create board actions', () => {
    const username = Cypress.env('username')
    const password = Cypress.env('password')

    const timestamp = new Date().toLocaleString()
    const boardTitle = `Test Board (${timestamp})`
    const cardTitle = `Test Card (${timestamp})`

    it('Can create board', {
        defaultCommandTimeout: 20000
    }, () => {
        cy.log('**Login**')
        cy.visit('/boards')
        cy.get('#loginId').
            should('exist').
            type(username)
        cy.get('#loginPassword').type(password)
        cy.get('#loginButton').click()

        cy.log('**Boards welcome screen**')
        cy.contains(`No thanks, I'll figure it out myself`).should('exist').click()

        // Select template
        cy.log('**Create board from tempalte**')
        cy.get('.BoardTemplateSelectorItem').contains('Project Tasks ').
            should('exist').
            click()
        cy.contains(`Use this template`).should('exist').click({force: true})

        cy.get('.BoardComponent').should('exist')

        cy.screenshot()

        // Change Title
        cy.get('.Editable.title').
            type('{selectall}').
            type(boardTitle).
            type('{enter}').
            should('have.value', boardTitle)

        // Create card
        cy.log('**Create card**')
        cy.get('.ViewHeader').get('.button-dropdown').click()
        cy.contains('Empty card').click()
        cy.get('.CardDetail').should('exist')

        //Check title has focus when card is created
        cy.log('**Check title has focus when card is created**')
        cy.get('.CardDetail .EditableArea.title').
            should('have.focus')

        // Change card title
        cy.log('**Change card title**')
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.get('.CardDetail .EditableArea.title').
            click().
            should('have.focus').
            wait(1000).
            type(cardTitle).
            should('have.value', cardTitle)

        cy.screenshot()

        // Close card dialog
        cy.log('**Close card dialog**')
        cy.get('.Dialog Button[title=\'Close dialog\']').
            should('be.visible').
            click()

        cy.screenshot()
    })
})
