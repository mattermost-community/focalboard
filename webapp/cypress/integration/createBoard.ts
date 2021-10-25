// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable max-nested-callbacks */

/// <reference types="Cypress" />

describe('Create and delete board / card', () => {
    const timestamp = new Date().toLocaleString()
    const boardTitle = `Test Board (${timestamp})`
    const cardTitle = `Test Card (${timestamp})`

    beforeEach(() => {
        cy.apiResetServer()
        cy.apiRegisterTestUser()
        cy.apiLoginTestUser()
        localStorage.setItem('welcomePageViewed', 'true')
    })

    it('Can create and delete a board and a card', () => {
        cy.visit('/')

        cy.log('Create new empty board')
        cy.contains('+ Add board').click({force: true})
        cy.contains('Empty board').click({force: true})
        cy.get('.BoardComponent').should('exist')

        cy.log('Change board title')
        cy.get('.Editable.title').
            type(boardTitle).
            type('{enter}').
            should('have.value', boardTitle)

        cy.log('Hide and show the sidebar')
        cy.get('.sidebarSwitcher').click()
        cy.get('.Sidebar .heading').should('not.exist')
        cy.get('.Sidebar .show-button').click()
        cy.get('.Sidebar .heading').should('exist')

        cy.log('Rename board view')
        const boardViewTitle = `Test board (${timestamp})`
        cy.get(".ViewHeader>.Editable[title='Board view']").should('exist')
        cy.get('.ViewHeader>.Editable').
            clear().
            type(boardViewTitle).
            type('{esc}')
        cy.get(`.ViewHeader .Editable[title='${boardViewTitle}']`).should('exist')

        cy.log('Create card')
        cy.get('.ViewHeader').contains('New').click()
        cy.get('.CardDetail').should('exist')

        cy.log('Change card title')
        cy.get('.CardDetail .EditableArea.title').
            type(cardTitle).
            type('{enter}').
            should('have.value', cardTitle)

        cy.log('Close card dialog')
        cy.get('.Dialog.dialog-back .wrapper').click({force: true})

        cy.log('Create table view')
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

        cy.log('Rename table view')
        const tableViewTitle = `Test table (${timestamp})`
        cy.get(".ViewHeader .Editable[title='Table view']").
            clear().
            type(tableViewTitle).
            type('{esc}')
        cy.get(`.ViewHeader .Editable[title='${tableViewTitle}']`).should('exist')

        cy.log('Sort the table')
        cy.get('.ViewHeader').contains('Sort').click()
        cy.get('.ViewHeader').
            contains('Sort').
            parent().
            contains('Name').
            click()

        cy.log('Delete board')
        cy.get('.Sidebar .octo-sidebar-list').
            contains(boardTitle).
            first().
            next().
            find('.Button.IconButton').
            click({force: true})
        cy.contains('Delete board').click({force: true})
        cy.contains(boardTitle).should('not.exist')
    })
})
