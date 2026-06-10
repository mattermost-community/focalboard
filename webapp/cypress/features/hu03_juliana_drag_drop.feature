Feature: Drag and Drop de tareas
  Como usuario de Focalboard
  Quiero mover tarjetas entre columnas
  Para organizar tareas de manera visual

  Scenario: Mover tarea de "Por hacer" a "En progreso"
    Given que existe una tarjeta llamada "Tarea 1" en la columna "Por hacer"
    When arrastro "Tarea 1" a la columna "En progreso"
    Then "Tarea 1" debería aparecer en la columna "En progreso"

  Scenario: Mover tarea de "En progreso" a "Hecho"
    Given que existe una tarjeta llamada "Tarea 2" en la columna "En progreso"
    When arrastro "Tarea 2" a la columna "Hecho"
    Then "Tarea 2" debería aparecer en la columna "Hecho"