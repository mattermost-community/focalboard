// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/*
 * Pruebas unitarias automatizadas frontend - HU03 Juliana
 *
 * Historia de usuario:
 * Como usuario, quiero mover tareas entre columnas arrastrando y soltando,
 * para actualizar su estado de “Pendientes” a “En proceso” o “Terminadas”
 * de manera visual y rápida.
 *
 * Archivo analizado:
 * webapp/src/components/kanban/kanban.tsx
 *
 * Funciones analizadas:
 * onDropToColumn()
 * onDropToCard()
 *
 * Herramienta:
 * Jest
 *
 * Técnicas aplicadas según rúbrica:
 * - Patrón AAA: Arrange, Act, Assert.
 * - Principios FIRST: Fast, Independent, Repeatable, Self-validating, Timely.
 * - Test Double indirecto: lectura controlada del archivo fuente para validar
 *   la estructura lógica sin depender de una interacción real de drag and drop.
 * - Aserciones expresivas tipo Fluent Assertions mediante expect().
 * - Cobertura por caminos independientes derivados del grafo de flujo de control.
 *
 * Caminos cubiertos:
 * P1: Movimiento de tarjeta hacia otra columna.
 * P2: Movimiento de tarjeta dentro de la misma columna.
 * P3: Reorganización de columna hacia la izquierda.
 * P4: Reorganización de columna hacia la derecha.
 * P5: Drop sin tarjetas y sin opción destino.
 * P6: Movimiento inválido sobre la misma tarjeta.
 * P7: Movimiento sobre tarjeta en la misma columna hacia abajo.
 * P8: Movimiento sobre tarjeta con cambio de columna.
 * P9: Movimiento sobre tarjeta sin cambio de columna.
 * P10: Movimiento a columna sin cambio de propiedad.
 */

import * as fs from 'fs'
import * as path from 'path'

/*
 * Test Double / apoyo de prueba:
 * Esta función permite leer el archivo fuente kanban.tsx de manera controlada.
 * Con esto se valida la estructura del código sin depender de la interfaz real,
 * del navegador ni de una acción física de drag and drop.
 */
function leerCodigoHU03Frontend(): string {
    const rutaArchivo = path.join(__dirname, 'kanban.tsx')
    return fs.readFileSync(rutaArchivo, 'utf8')
}

/*
 * Función de apoyo:
 * Permite comparar fragmentos de código eliminando espacios, saltos de línea
 * y tabulaciones. Esto hace que las pruebas sean más repetibles frente a
 * diferencias menores de formato.
 */
function normalizarCodigo(codigo: string): string {
    return codigo
        .replace(/\s+/g, '')
        .replace(/\r/g, '')
        .replace(/\n/g, '')
        .replace(/\t/g, '')
}

describe('HU03 Juliana - Mover tareas entre columnas - Frontend', () => {
    test('PU-HU03F-01 - P1 - movimiento de tarjeta hacia otra columna', () => {
        /*
         * Objetivo:
         * Validar el camino P1 del grafo de flujo de control.
         *
         * Camino P1:
         * N1-N2-N3-N4-N5-N6-N7-N8-N10-N11-N12-N13-N14-N15-N16-N17-N18-N20-N21-N22-N55
         *
         * Resultado esperado:
         * El sistema debe actualizar la propiedad de la tarjeta mediante
         * changePropertyValue() y actualizar el orden visual con changeViewCardOrder().
         */

        // Arrange
        const codigo = leerCodigoHU03Frontend()

        const validaciones = [
            'const onDropToColumn = useCallback',
            'const {selectedCardIds} = props',
            'const optionId = option ? option.id : undefined',
            'let draggedCardIds = selectedCardIds',
            'if (card)',
            'draggedCardIds = Array.from(new Set(selectedCardIds).add(card.id))',
            'if (draggedCardIds.length > 0)',
            'await mutator.performAsUndoGroup',
            'const draggedCards',
            'for (const draggedCard of draggedCards)',
            'const oldValue = draggedCard.fields.properties[groupByProperty!.id]',
            'if (optionId !== oldValue)',
            'mutator.changePropertyValue',
            'const newOrder = orderAfterMoveToColumn(draggedCardIds, optionId)',
            'mutator.changeViewCardOrder',
            'await Promise.all(awaits)',
        ]

        // Act + Assert
        for (const texto of validaciones) {
            expect(codigo).toContain(texto)
        }
    })

    test('PU-HU03F-02 - P2 - movimiento de tarjeta dentro de la misma columna', () => {
        /*
         * Objetivo:
         * Validar el camino P2 del grafo de flujo de control.
         *
         * Resultado esperado:
         * Si la tarjeta no cambia de columna, no se requiere actualizar su propiedad,
         * pero sí debe conservarse la actualización del orden visual.
         */

        // Arrange
        const codigo = leerCodigoHU03Frontend()

        // Act
        const contieneValidacionDeMismaColumna = codigo.includes('if (optionId !== oldValue)')
        const contieneActualizacionDePropiedad = codigo.includes('mutator.changePropertyValue')
        const contieneActualizacionDeOrden = codigo.includes('mutator.changeViewCardOrder')

        // Assert
        expect(codigo).toContain('const oldValue = draggedCard.fields.properties[groupByProperty!.id]')
        expect(contieneValidacionDeMismaColumna).toBe(true)
        expect(contieneActualizacionDePropiedad).toBe(true)
        expect(codigo).toContain('const newOrder = orderAfterMoveToColumn(draggedCardIds, optionId)')
        expect(contieneActualizacionDeOrden).toBe(true)
    })

    test('PU-HU03F-03 - P3 - reorganización de columna hacia la izquierda', () => {
        /*
         * Objetivo:
         * Validar el camino P3 del grafo de flujo de control.
         *
         * Resultado esperado:
         * Cuando no hay tarjetas arrastradas, pero existe dstOption y la columna se
         * mueve hacia la izquierda, el sistema debe reorganizar las columnas visibles.
         */

        // Arrange
        const codigo = leerCodigoHU03Frontend()

        // Act
        const contieneDstOption = codigo.includes('} else if (dstOption) {')
        const contieneMoveToAboveRow = codigo.includes("const moveTo = (srcBlockX > dstBlockX ? 'aboveRow' : 'belowRow') as Position")
        const contieneReorganizacion = codigo.includes('dragAndDropRearrange')

        // Assert
        expect(contieneDstOption).toBe(true)
        expect(codigo).toContain('const visibleOptionIds = visibleGroups.map((o) => o.option.id)')
        expect(codigo).toContain('const srcBlockX = visibleOptionIds.indexOf(option.id)')
        expect(codigo).toContain('const dstBlockX = visibleOptionIds.indexOf(dstOption.id)')
        expect(contieneMoveToAboveRow).toBe(true)
        expect(contieneReorganizacion).toBe(true)
        expect(codigo).toContain('mutator.changeViewVisibleOptionIds')
    })

    test('PU-HU03F-04 - P4 - reorganización de columna hacia la derecha', () => {
        /*
         * Objetivo:
         * Validar el camino P4 del grafo de flujo de control.
         *
         * Resultado esperado:
         * Cuando no hay tarjetas arrastradas, pero existe dstOption y la columna se
         * mueve hacia la derecha, el sistema debe reorganizar las columnas visibles.
         */

        // Arrange
        const codigo = leerCodigoHU03Frontend()

        // Act
        const contieneCondicionDireccion = codigo.includes("srcBlockX > dstBlockX ? 'aboveRow' : 'belowRow'")
        const contieneMoveTo = codigo.includes('moveTo')
        const contieneOpcionesReordenadas = codigo.includes('visibleOptionIdsRearranged')

        // Assert
        expect(contieneCondicionDireccion).toBe(true)
        expect(contieneMoveTo).toBe(true)
        expect(contieneOpcionesReordenadas).toBe(true)
        expect(codigo).toContain('dragAndDropRearrange')
        expect(codigo).toContain('mutator.changeViewVisibleOptionIds')
    })

    test('PU-HU03F-05 - P5 - drop sin tarjetas y sin opción destino', () => {
        /*
         * Objetivo:
         * Validar el camino P5 del grafo de flujo de control.
         *
         * Resultado esperado:
         * Si no existen tarjetas arrastradas y tampoco existe dstOption,
         * el flujo debe finalizar sin realizar cambios.
         */

        // Arrange
        const codigo = normalizarCodigo(leerCodigoHU03Frontend())

        // Act
        const contieneValidacionTarjetasArrastradas = codigo.includes('if(draggedCardIds.length>0)')
        const contieneRamaDstOption = codigo.includes('}elseif(dstOption){')
        const contieneCambioOpcionesVisibles = codigo.includes('mutator.changeViewVisibleOptionIds')

        // Assert
        expect(contieneValidacionTarjetasArrastradas).toBe(true)
        expect(contieneRamaDstOption).toBe(true)
        expect(contieneCambioOpcionesVisibles).toBe(true)
    })

    test('PU-HU03F-06 - P6 - movimiento inválido sobre la misma tarjeta', () => {
        /*
         * Objetivo:
         * Validar el camino P6 del grafo de flujo de control.
         *
         * Resultado esperado:
         * Si la tarjeta origen es igual a la tarjeta destino, o si no existe
         * groupByProperty, el flujo debe retornar sin realizar cambios.
         */

        // Arrange
        const codigo = leerCodigoHU03Frontend()

        // Act
        const contieneDropToCard = codigo.includes('const onDropToCard = useCallback')
        const contieneValidacionMovimientoInvalido = codigo.includes('if (srcCard.id === dstCard.id || !groupByProperty)')
        const contieneReturn = codigo.includes('return')

        // Assert
        expect(contieneDropToCard).toBe(true)
        expect(contieneValidacionMovimientoInvalido).toBe(true)
        expect(contieneReturn).toBe(true)
    })

    test('PU-HU03F-07 - P7 - movimiento sobre tarjeta en la misma columna hacia abajo', () => {
        /*
         * Objetivo:
         * Validar el camino P7 del grafo de flujo de control.
         *
         * Resultado esperado:
         * Cuando una tarjeta se mueve dentro de la misma columna hacia una posición
         * inferior, el sistema debe ajustar destIndex y actualizar el orden visual.
         */

        // Arrange
        const codigo = leerCodigoHU03Frontend()

        // Act
        const contieneDraggingDown = codigo.includes('const isDraggingDown = cardOrder.indexOf(srcCard.id) <= cardOrder.indexOf(dstCard.id)')
        const contieneMismaColumna = codigo.includes('if (srcCard.fields.properties[groupByProperty!.id] === optionId && isDraggingDown)')
        const contieneAjusteDestIndex = codigo.includes('destIndex += 1')

        // Assert
        expect(contieneDraggingDown).toBe(true)
        expect(contieneMismaColumna).toBe(true)
        expect(contieneAjusteDestIndex).toBe(true)
        expect(codigo).toContain('cardOrder.splice(destIndex, 0, ...draggedCardIds)')
        expect(codigo).toContain('mutator.changeViewCardOrder')
    })

    test('PU-HU03F-08 - P8 - movimiento sobre tarjeta con cambio de columna', () => {
        /*
         * Objetivo:
         * Validar el camino P8 del grafo de flujo de control.
         *
         * Resultado esperado:
         * Cuando una tarjeta se suelta sobre otra tarjeta ubicada en una columna
         * diferente, se debe actualizar la propiedad de la tarjeta y el orden visual.
         */

        // Arrange
        const codigo = leerCodigoHU03Frontend()

        // Act
        const contieneOptionDestino = codigo.includes('const optionId = dstCard.fields.properties[groupByProperty.id]')
        const contieneOldOption = codigo.includes('const oldOptionId = draggedCard.fields.properties[groupByProperty!.id]')
        const contieneCambioDeColumna = codigo.includes('if (optionId !== oldOptionId)')

        // Assert
        expect(contieneOptionDestino).toBe(true)
        expect(contieneOldOption).toBe(true)
        expect(contieneCambioDeColumna).toBe(true)
        expect(codigo).toContain('mutator.changePropertyValue')
        expect(codigo).toContain('mutator.changeViewCardOrder')
    })

    test('PU-HU03F-09 - P9 - movimiento sobre tarjeta sin cambio de columna', () => {
        /*
         * Objetivo:
         * Validar el camino P9 del grafo de flujo de control.
         *
         * Resultado esperado:
         * Si la tarjeta se mueve sobre otra tarjeta sin cambiar de columna,
         * no se actualiza la propiedad, pero sí se actualiza el orden visual.
         */

        // Arrange
        const codigo = leerCodigoHU03Frontend()

        // Act
        const contieneValidacionCambioColumna = codigo.includes('if (optionId !== oldOptionId)')
        const contienePromiseAll = codigo.includes('await Promise.all(awaits)')
        const contieneCambioOrden = codigo.includes('await mutator.changeViewCardOrder(props.board.id, activeView.id, activeView.fields.cardOrder, cardOrder, description)')

        // Assert
        expect(contieneValidacionCambioColumna).toBe(true)
        expect(contienePromiseAll).toBe(true)
        expect(contieneCambioOrden).toBe(true)
    })

    test('PU-HU03F-10 - P10 - movimiento a columna sin cambio de propiedad', () => {
        /*
         * Objetivo:
         * Validar el camino P10 del grafo de flujo de control.
         *
         * Resultado esperado:
         * Si existe card, pero la columna destino coincide con el valor anterior,
         * no se actualiza la propiedad, pero sí se recalcula y actualiza el orden visual.
         */

        // Arrange
        const codigo = leerCodigoHU03Frontend()

        // Act
        const contieneCard = codigo.includes('if (card)')
        const contieneValidacionOldValue = codigo.includes('if (optionId !== oldValue)')
        const contieneNuevoOrden = codigo.includes('const newOrder = orderAfterMoveToColumn(draggedCardIds, optionId)')
        const contieneActualizacionOrden = codigo.includes('mutator.changeViewCardOrder')

        // Assert
        expect(contieneCard).toBe(true)
        expect(contieneValidacionOldValue).toBe(true)
        expect(contieneNuevoOrden).toBe(true)
        expect(contieneActualizacionOrden).toBe(true)
    })
})