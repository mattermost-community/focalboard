// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

Cypress.Commands.add('apiRegisterUser', (data: Cypress.UserData, token?: string, failOnError?: boolean) => {
    return cy.request({
        method: 'POST',
        url: '/api/v1/register',
        body: {
            ...data,
            token,
        },
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
        },
        failOnStatusCode: failOnError,
    })
})

Cypress.Commands.add('apiLoginUser', (data: Cypress.LoginData) => {
    return cy.request({
        method: 'POST',
        url: '/api/v1/login',
        body: {
            ...data,
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

Cypress.Commands.add('apiInitServer', () => {
    const data: Cypress.UserData = {
        username: Cypress.env('username'),
        password: Cypress.env('password'),
        email: Cypress.env('email'),
    }
    return cy.apiRegisterUser(data, '', false).apiLoginUser(data)
})

const headers = () => ({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: `Bearer ${localStorage.getItem('focalboardSessionId')}`,
    },
})

Cypress.Commands.add('apiGetMe', () => {
    return cy.request({
        method: 'GET',
        url: '/api/v1/users/me',
        ...headers(),
    }).then((response) => response.body.id)
})

Cypress.Commands.add('apiChangePassword', (userId: string, oldPassword: string, newPassword: string) => {
    const body = {oldPassword, newPassword}
    return cy.request({
        method: 'POST',
        url: `/api/v1/users/${encodeURIComponent(userId)}/changepassword`,
        ...headers(),
        body,
    })
})
