// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable cypress/no-unnecessary-waiting */

Cypress.Commands.add('uiCreateBoard', (item: string) => {
    cy.log(`Create new board: ${item}`)

    cy.contains('+ Add board').should('be.visible').click()

    cy.contains(item).click()

    cy.contains('Use this template').click({force: true}).wait(1000)
})

Cypress.Commands.add('uiCreateEmptyBoard', () => {
    cy.log('Create new empty board')

    cy.contains('+ Add board').should('be.visible').click().wait(500)
    return cy.contains('Create an empty board').click({force: true}).wait(1000)
})
