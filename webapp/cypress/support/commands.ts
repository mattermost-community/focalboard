// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable @typescript-eslint/no-namespace */

declare namespace Cypress {
    type LoginData = {
        username: string
        password: string
    }
    interface Chainable {
        login: (data: LoginData) => Chainable
    }
}

Cypress.Commands.add('login', (data: Cypress.LoginData) => {
    return cy.request({
        method: 'POST',
        url: '/api/v1/login',
        body: {
            username: data.username,
            password: data.password,
            type: 'normal',
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    }).then((response) => {
        expect(response.body).to.have.property('token')
        localStorage.setItem('focalboardSessionId', response.body.token)
    })
})
