// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Create and delete board / card', () => {
    it('Can create and delete a board and card', () => {
        cy.visit('/');
        cy.contains('+ Add Board').click({force: true});
        cy.contains('Empty board').click({force: true});
        cy.get('.BoardComponent').should('exist');

        const timestamp = new Date().toLocaleString();

        // Board title
        const boardTitle = `Test Board (${timestamp})`;
        cy.get('.ViewTitle>.Editable.title').
            type(boardTitle).
            type('{enter}').
            should('have.value', boardTitle);

        // Create card
        cy.get('.ViewHeader').contains('New').click();
        cy.get('.CardDetail').should('exist');

        // Card title
        const cardTitle = `Test Card (${timestamp})`;
        cy.get('.CardDetail>.Editable.title').
            type(cardTitle).
            type('{enter}').
            should('have.value', cardTitle);

        // Close card
        cy.get('.Dialog.dialog-back').click({force: true});

        // Delete board
        cy.get('.Sidebar .octo-sidebar-list').
            contains(boardTitle).first().
            next().
            find('.Button.IconButton').
            click({force: true});

        cy.contains('Delete Board').click({force: true});

        // Board should not exist
        cy.contains(boardTitle).should('not.exist');
    });
});
