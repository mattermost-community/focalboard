// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Login actions', () => {
    const username = Cypress.env('username')
    const email = Cypress.env('email')
    const password = Cypress.env('password')

    beforeEach(() => {
        localStorage.setItem('language', 'en')
    })

    it('Can perform login/register actions', () => {
        // Redirects to login page
        cy.log('**Redirects to login page (except plugin mode) **')
        cy.visit('/')
        cy.location('pathname').should('eq', '/login')
        cy.get('.LoginPage').contains('Log in')
        cy.get('#login-username').should('exist')
        cy.get('#login-password').should('exist')
        cy.get('button').contains('Log in')
        cy.get('a').contains('create an account', {matchCase: false})

        // Can register a user
        cy.log('**Can register a user**')
        cy.visit('/login')
        cy.get('a').contains('create an account', {matchCase: false}).click()
        cy.location('pathname').should('eq', '/register')
        cy.get('.RegisterPage').contains('Sign up')
        cy.get('#login-email').type(email)
        cy.get('#login-username').type(username)
        cy.get('#login-password').type(password)
        cy.get('button').contains('Register').click()
        workspaceIsAvailable()

        // Can log out user
        cy.log('**Can log out user**')
        cy.get('.SidebarUserMenu').click()
        cy.get('.menu-name').contains('Log out').click()
        cy.location('pathname').should('eq', '/login')

        // User should not be logged in automatically
        cy.log('**User should not be logged in automatically**')
        cy.visit('/')
        cy.location('pathname').should('eq', '/login')

        // Can log in registered user
        cy.log('**Can log in registered user**')
        loginUser(password)

        // Can change password
        cy.log('**Can change password**')
        const newPassword = 'new_password'
        cy.get('.SidebarUserMenu').click()
        cy.get('.menu-name').contains('Change password').click()
        cy.location('pathname').should('eq', '/change_password')
        cy.get('.ChangePasswordPage').contains('Change Password')
        cy.get('#login-oldpassword').type(password)
        cy.get('#login-newpassword').type(newPassword)
        cy.get('button').contains('Change password').click()
        cy.get('.succeeded').click()
        workspaceIsAvailable()
        logoutUser()

        // Can log in user with new password
        cy.log('**Can log in user with new password**')
        loginUser(newPassword).then(() => resetPassword(newPassword))
        logoutUser()

        // Can't register second user without invite link
        cy.log('**Can\'t register second user without invite link**')
        cy.visit('/register')
        cy.get('#login-email').type(email)
        cy.get('#login-username').type(username)
        cy.get('#login-password').type(password)
        cy.get('button').contains('Register').click()
        cy.get('.error').contains('Invalid registration link').should('exist')

        // Can register second user using invite link
        cy.log('**Can register second user using invite link**')

        // Copy invite link
        cy.log('**Copy invite link**')
        loginUser(password)
        cy.get('.Sidebar .SidebarUserMenu').click()
        cy.get('.menu-name').contains('Invite users').click()
        cy.get('.Button').contains('Copy link').click()
        cy.get('.Button').contains('Copied').should('exist')

        cy.get('a.shareUrl').invoke('attr', 'href').then((inviteLink) => {
            logoutUser()

            // Register a new user
            cy.log('**Register new user**')
            cy.visit(inviteLink as string)
            cy.get('#login-email').type('new-user@mail.com')
            cy.get('#login-username').type('new-user')
            cy.get('#login-password').type('new-password')
            cy.get('button').contains('Register').click()
            workspaceIsAvailable()
        })
    })

    const workspaceIsAvailable = () => {
        cy.location('pathname').should('eq', '/')
        cy.get('.Workspace').should('exist')
        return cy.get('.Sidebar').should('exist')
    }

    const loginUser = (withPassword: string) => {
        cy.visit('/login')
        cy.get('#login-username').type(username)
        cy.get('#login-password').type(withPassword)
        cy.get('button').contains('Log in').click()
        return workspaceIsAvailable()
    }

    const logoutUser = () => {
        cy.log('**Log out existing user**')
        cy.get('.SidebarUserMenu').click()
        cy.get('.menu-name').contains('Log out').click()
        cy.location('pathname').should('eq', '/login')
    }

    const resetPassword = (oldPassword: string) => {
        cy.apiGetMe().then((userId) => cy.apiChangePassword(userId, oldPassword, password))
    }
})
