// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Login actions', () => {
    const username = 'username'
    const email = 'username@gmail.com'
    const password = 'password'

    beforeEach(() => {
        cy.apiResetServer()
    })

    const workspaceIsAvailable = () => {
        cy.location('pathname').should('eq', '/')
        cy.get('.Workspace').should('exist')
        cy.get('.Sidebar').should('exist')
    }

    it('Redirects to login page', () => {
        cy.visit('/')
        cy.location('pathname').should('eq', '/login')
        cy.get('.LoginPage').contains('Log in')
        cy.get('#login-username').should('exist')
        cy.get('#login-password').should('exist')
        cy.get('button').contains('Log in')
        cy.get('a').contains('create an account')
    })

    it('Can register user', () => {
        cy.visit('/login')
        cy.get('a').contains('create an account').click()
        cy.location('pathname').should('eq', '/register')
        cy.get('.RegisterPage').contains('Sign up')
        cy.get('#login-email').type(email)
        cy.get('#login-username').type(username)
        cy.get('#login-password').type(password)
        cy.get('button').contains('Register').click()
        workspaceIsAvailable()
    })

    it('Can log in user', () => {
        cy.apiRegisterUser({username, email, password})
        cy.visit('/login')
        cy.get('#login-username').type(username)
        cy.get('#login-password').type(password)
        cy.get('button').contains('Log in').click()
        workspaceIsAvailable()
    })

    it('Can change password', () => {
        const newPassword = 'new_password'
        cy.apiRegisterUser({username, email, password})
        cy.apiLoginUser({username, password})
        cy.visit('/')
        cy.get('.Sidebar .SidebarUserMenu').click()
        cy.get('.Menu .MenuOption .menu-name').contains('Change password').click()
        cy.location('pathname').should('eq', '/change_password')
        cy.get('.ChangePasswordPage').contains('Change Password')
        cy.get('#login-oldpassword').type(password)
        cy.get('#login-newpassword').type(newPassword)
        cy.get('button').contains('Change password').click()
        cy.get('.succeeded').click()
        workspaceIsAvailable()
        cy.apiLoginUser({username, password: newPassword})
        cy.visit('/')
        workspaceIsAvailable()
    })

    it('Can log out user', () => {
        cy.apiRegisterUser({username, email, password})
        cy.apiLoginUser({username, password})
        cy.visit('/')
        cy.get('.Sidebar .SidebarUserMenu').click()
        cy.get('.Menu .MenuOption .menu-name').contains('Log out').click()
        cy.location('pathname').should('eq', '/login')
    })
})
