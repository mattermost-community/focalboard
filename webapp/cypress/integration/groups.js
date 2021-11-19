// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable max-nested-callbacks */

/// <reference types="Cypress" />

describe('Manage groups', () => {
  beforeEach(() => {
      localStorage.setItem('focalboardSessionId', 'TESTTOKEN');
      localStorage.setItem('language', 'en');
      cy.expect(localStorage.getItem('focalboardSessionId')).to.eq('TESTTOKEN');
      localStorage.setItem('welcomePageViewed', 'true');
  });

  it('MM-T4284 Adding a group', () => {
      cy.visit('/');
      cy.contains('+ Add board').click({force: true});
      cy.contains('Empty board').click({force: true});

      cy.contains('+ Add a group').click({force: true});
      cy.get(`.KanbanColumnHeader .Editable[value='New group']`).should('exist');

      cy.get(`.KanbanColumnHeader .Editable[value='New group']`).
          clear().
          type('Group 1').
          blur();
      cy.get(`.KanbanColumnHeader .Editable[value='Group 1']`).should('exist');
  });
});
