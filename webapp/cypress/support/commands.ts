// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable @typescript-eslint/no-namespace */

declare namespace Cypress {
    interface Chainable {
        apiInitServer: () => Chainable
    }
}

const loginTestUser = () => {
    return cy.request({
        method: 'POST',
        url: '/api/v1/login',
        body: {
            username: Cypress.env('username'),
            password: Cypress.env('password'),
            type: 'normal',
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    }).then((response) => {
        expect(response.body).to.have.property('token')
        localStorage.setItem('focalboardSessionId', response.body.token)
    })
}

Cypress.Commands.add('apiInitServer', () => {
    return cy.request({
        method: 'POST',
        url: '/api/v1/register',
        body: {
            username: Cypress.env('username'),
            password: Cypress.env('password'),
            email: Cypress.env('email'),
            token: '',
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
        failOnStatusCode: false,
    }).then(loginTestUser)
})
