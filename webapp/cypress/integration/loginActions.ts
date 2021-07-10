// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Login actions', () => {
    const username = 'username'
    const email = 'username@gmail.com'
    const password = 'password'
    const newPassword = 'new_password'

    const workspaceIsAvailable = () => {
        cy.get('.Workspace').should('exist')
        cy.get('.Sidebar').should('exist')
    }

    const loginWithPassword = (withPassword: string) => {
        cy.visit('/login')
        cy.get('#login-username').type(username)
        cy.get('#login-password').type(withPassword)
        cy.get('button').contains('Log in').click()
        workspaceIsAvailable()
    }

    const logout = () => {
        cy.get('.Sidebar .SidebarUserMenu').click()
        cy.get('.Menu .MenuOption .menu-name').contains('Log out').click()
        cy.location('pathname').should('eq', '/login')
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
        logout()
    })

    it('Can change password', () => {
        loginWithPassword(password)
        cy.get('.Sidebar .SidebarUserMenu').click()
        cy.get('.Menu .MenuOption .menu-name').contains('Change password').click()
        cy.location('pathname').should('eq', '/change_password')
        cy.get('.ChangePasswordPage').contains('Change Password')
        cy.get('#login-oldpassword').type(password)
        cy.get('#login-newpassword').type(newPassword)
        cy.get('button').contains('Change password').click()
        cy.get('.succeeded').click()
        workspaceIsAvailable()
        logout()
    })

    it('Can log in user with new password', () => {
        loginWithPassword(newPassword)
    })
})
