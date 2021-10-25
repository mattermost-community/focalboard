// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable @typescript-eslint/no-namespace */

declare namespace Cypress {
    type LoginData = {
        username: string
        password: string
    }
    type UserData = LoginData & {
        email: string
    }
    interface Chainable {
        apiResetServer: () => Chainable
        apiRegisterUser: (data: UserData) => Chainable
        apiRegisterTestUser: () => Chainable
        apiLoginUser: (data: LoginData) => Chainable
        apiLoginTestUser: () => Chainable
    }
}

const testUserData: Cypress.UserData = {
    username: 'test-user',
    password: 'test-password',
    email: 'test@mail.com',
}

Cypress.Commands.add('apiResetServer', () => {
    return cy.request({
        method: 'POST',
        url: '/test/reset',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
})

Cypress.Commands.add('apiRegisterUser', (data: Cypress.UserData) => {
    return cy.request({
        method: 'POST',
        url: '/api/v1/register',
        body: {
            username: data.username,
            email: data.email,
            password: data.password,
            token: '',
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
    })
})

Cypress.Commands.add('apiRegisterTestUser', () => {
    cy.apiRegisterUser(testUserData)
})

Cypress.Commands.add('apiLoginUser', (data: Cypress.LoginData) => {
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

Cypress.Commands.add('apiLoginTestUser', () => {
    cy.apiLoginUser(testUserData)
})
