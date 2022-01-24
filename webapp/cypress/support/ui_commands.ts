// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable cypress/no-unnecessary-waiting */

Cypress.Commands.add('uiCreateBoard', (item: string) => {
    cy.log(`Create new board: ${item}`)

    cy.contains('+ Add board').should('be.visible').click()

    return cy.contains(item).click().wait(1000)
})
