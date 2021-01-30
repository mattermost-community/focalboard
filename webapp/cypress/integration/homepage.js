// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

describe('Load homepage', () => {
    it('Can load homepage', () => {
        cy.visit('/');
        cy.get('div#main-app').should('exist');
    });
});
