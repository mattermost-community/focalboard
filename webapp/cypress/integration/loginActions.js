// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Login actions', () => {
    const username = 'username';
    const email = 'username@gmail.com';
    const password = 'password';

    it('Redirects to login page', () => {
        cy.visit('/');
        cy.location('pathname').should('eq', '/login');
        cy.get('.LoginPage').contains('Log in');
        cy.get('input[placeholder="Enter username"').should('exist');
        cy.get('input[placeholder="Enter password"').should('exist');
        cy.get('button').contains('Log in');
        cy.get('a').contains('create an account');
    });

    it('Can register user', () => {
        cy.get('a').contains('create an account').click();
        cy.location('pathname').should('eq', '/register');
        cy.get('.RegisterPage').contains('Sign up');
        cy.get('input[placeholder="Enter email"').type(email);
        cy.get('input[placeholder="Enter username"').type(username);
        cy.get('input[placeholder="Enter password"').type(password);
        cy.get('button').contains('Register').click();
        cy.get('.Workspace').should('exist');
        cy.get('.Sidebar').should('exist');
    });

    it('Can login registered user', () => {
        cy.visit('/login');
        cy.get('input[placeholder="Enter username"').type(username);
        cy.get('input[placeholder="Enter password"').type(password);
        cy.get('button').contains('Log in').click();
    });
});
