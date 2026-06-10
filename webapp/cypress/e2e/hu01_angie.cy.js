describe('HU01 - Crear tablero', () => {
  beforeEach(() => cy.visit('/'))

  it('Crear un tablero vacío', () => {
    cy.get('#new-board-input').type('Tablero QA')
    cy.get('#create-board-button').click()
    cy.get('#board-name').should('contain.text', 'Tablero QA')
    cy.get('#column-1').should('contain.text', 'Por hacer')
    cy.get('#column-2').should('contain.text', 'En progreso')
    cy.get('#column-3').should('contain.text', 'Hecho')
  })

  it('Validar tablero duplicado', () => {
    cy.get('#new-board-input').type('Tablero QA')
    cy.get('#create-board-button').click()
    cy.get('#new-board-input').type('Tablero QA')
    cy.get('#create-board-button').click()
    cy.get('#error-message').should('contain.text', 'Nombre duplicado')
  })
})