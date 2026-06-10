describe('HU03 - Drag and Drop de tareas', () => {

  beforeEach(() => {
    cy.visit('/') // tu baseUrl
  })

  it('Mover Tarea 1 de Por hacer a En progreso', () => {
    cy.get('#task-Tarea1').drag('#column-EnProgreso')
    cy.get('#column-EnProgreso .task').should('contain.text', 'Tarea 1')
  })

  it('Mover Tarea 2 de En progreso a Hecho', () => {
    cy.get('#task-Tarea2').drag('#column-Hecho')
    cy.get('#column-Hecho .task').should('contain.text', 'Tarea 2')
  })

})