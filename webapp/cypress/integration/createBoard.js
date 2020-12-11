// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/// <reference types="Cypress" />

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

        // Rename board view
        const boardViewTitle = `Test board (${timestamp})`;
        cy.get('.ViewHeader').
            contains('.octo-editable', 'Board view').
            clear().
            type(boardViewTitle).
            type('{esc}');

        cy.get('.ViewHeader').
            contains('.octo-editable', boardViewTitle).
            should('exist');

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

        // Create table view
        // cy.intercept('POST', '/api/v1/blocks').as('insertBlocks');
        cy.get('.ViewHeader').get('.DropdownIcon').first().parent().click();
        cy.get('.ViewHeader').contains('Add View').click();
        cy.get('.ViewHeader').contains('Add View').click();
        cy.get('.ViewHeader').contains('Add View').parent().contains('Table').click();

        // cy.wait('@insertBlocks');

        // Wait for round-trip to complete and DOM to update
        cy.contains('.octo-editable', 'Table view').should('exist');

        // Card should exist in table
        cy.get(`.TableRow [value='${cardTitle}']`).should('exist');

        // Rename table view
        const tableViewTitle = `Test table (${timestamp})`;
        cy.get('.ViewHeader').
            contains('.octo-editable', 'Table view').
            clear().
            type(tableViewTitle).
            type('{esc}');

        cy.get('.ViewHeader').
            contains('.octo-editable', tableViewTitle).
            should('exist');

        // Sort
        cy.get('.ViewHeader').contains('Sort').click();
        cy.get('.ViewHeader').contains('Sort').parent().contains('Name').click();

        // Delete board
        cy.get('.Sidebar .octo-sidebar-list').
            contains(boardTitle).first().
            next().
            find('.Button.IconButton').
            click({force: true});

        cy.contains('Delete board').click({force: true});

        // // Board should not exist
        cy.contains(boardTitle).should('not.exist');
    });
});
