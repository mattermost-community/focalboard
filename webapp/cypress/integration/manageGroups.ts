// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Manage groups', () => {
    beforeEach(() => {
        cy.apiInitServer()
        cy.apiResetBoards()
        localStorage.setItem('welcomePageViewed', 'true')
    })

    it('MM-T4284 Adding a group', () => {
        cy.visit('/')
        cy.contains('+ Add board').click({force: true})
        cy.contains('Empty board').click({force: true})

        cy.contains('+ Add a group').click({force: true})
        cy.get('.KanbanColumnHeader .Editable[value=\'New group\']').should('exist')

        cy.get('.KanbanColumnHeader .Editable[value=\'New group\']').
            clear().
            type('Group 1').
            blur()
        cy.get('.KanbanColumnHeader .Editable[value=\'Group 1\']').should('exist')
    })

    it('MM-T4285 Adding group color', () => {
        cy.visit('/')

        cy.contains('+ Add board').click({force: true})
        cy.contains('Empty board').click({force: true})
        cy.contains('+ Add a group').click({force: true})
        cy.get('.KanbanColumnHeader .Editable[value=\'New group\']').should('exist')

        cy.get('.KanbanColumnHeader').last().within(() => {
            cy.get('.icon-dots-horizontal').click({force: true})
            cy.get('.menu-options').should('exist').within(() => {
                cy.contains('Hide').should('exist')
                cy.contains('Delete').should('exist')

                // Some colours
                cy.contains('Brown').should('exist')
                cy.contains('Gray').should('exist')
                cy.contains('Orange').should('exist')

                // Click on green
                cy.contains('Green').should('exist').click({force: true})
            })
            cy.get('.Label.propColorGreen').should('exist')
        })
    })
})
