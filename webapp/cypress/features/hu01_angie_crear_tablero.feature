Feature: Crear tablero con columnas predefinidas
  Como usuario de Focalboard
  Quiero crear un tablero nuevo con columnas predefinidas
  Para poder organizar mis tareas desde el inicio

  Scenario: Crear un tablero vacío
    Given que estoy en la página principal de Focalboard
    When creo un tablero llamado "Tablero QA"
    Then el tablero "Tablero QA" debe aparecer con columnas "Por hacer", "En progreso", "Hecho"

  Scenario: Validar nombre de tablero duplicado
    Given que existe un tablero llamado "Tablero QA"
    When intento crear otro tablero con nombre "Tablero QA"
    Then debería ver un mensaje de error indicando "Nombre duplicado"