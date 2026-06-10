describe('HU01 - Crear tablero con columnas predefinidas', () => {

  beforeEach(() => {
    cy.visit('/') // baseUrl configurada en cypress.config.js
  })

  it('Crear un tablero vacío', () => {
    cy.get('#new-board-input').type('Tablero QA')
    cy.get('#create-board-button').click()
    cy.get('#board-name').should('contain.text', 'Tablero QA')
    cy.get('#column-1').should('contain.text', 'Por hacer')
    cy.get('#column-2').should('contain.text', 'En progreso')
    cy.get('#column-3').should('contain.text', 'Hecho')
  })

  it('Validar nombre de tablero duplicado', () => {
    // Crear primero el tablero
    cy.get('#new-board-input').type('Tablero QA')
    cy.get('#create-board-button').click()
    // Intentar crear duplicado
    cy.get('#new-board-input').type('Tablero QA')
    cy.get('#create-board-button').click()
    cy.get('#error-message').should('contain.text', 'Nombre duplicado')
  })

})