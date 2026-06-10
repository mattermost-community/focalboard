// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/*
 * Pruebas unitarias automatizadas - HU01 Angie
 *
 * Historia de usuario:
 * Como usuario de un equipo, quiero crear un tablero nuevo con columnas predefinidas
 * para organizar mis tareas, de manera que pueda iniciar un proyecto rápidamente.
 *
 * Archivo analizado:
 * webapp/src/mutator.ts
 *
 * Método analizado:
 * addEmptyBoard()
 *
 * Herramienta:
 * Jest
 *
 * Técnicas aplicadas según rúbrica:
 * - Patrón AAA: Arrange, Act, Assert.
 * - Principios FIRST: Fast, Independent, Repeatable, Self-validating, Timely.
 * - Test Doubles / Mocks: FetchMock, intlMock, afterRedo mock, beforeUndo mock.
 * - Aserciones expresivas tipo Fluent Assertions mediante expect().
 * - Cobertura por caminos independientes derivados del grafo de flujo de control.
 *
 * Caminos cubiertos:
 * P1: Creación exitosa con afterRedo definido.
 * P2: Creación exitosa sin afterRedo definido.
 * P3: Error durante createBoardsAndBlocks().
 */

import mutator from './mutator'
import {TestBlockFactory} from './test/testBlockFactory'
import 'isomorphic-fetch'
import {FetchMock} from './test/fetchMock'
import {mockDOM} from './testUtils'

global.fetch = FetchMock.fn

beforeEach(() => {
    /*
     * FIRST - Independent / Repeatable:
     * Antes de cada prueba se reinicia el mock de fetch para que una prueba
     * no dependa del resultado o llamadas realizadas por otra prueba.
     */
    FetchMock.fn.mockReset()
})

beforeAll(() => {
    /*
     * Test Double:
     * Se simula el entorno DOM requerido por el frontend para ejecutar
     * la prueba de forma controlada sin depender de un navegador real.
     */
    mockDOM()
})

/*
 * Test Double:
 * intlMock reemplaza el servicio real de internacionalización.
 * Esto permite probar addEmptyBoard() sin depender de traducciones externas.
 */
const intlMock = {
    formatMessage: ({defaultMessage}: {id: string, defaultMessage: string}) => defaultMessage,
} as any

describe('HU01 Angie - Crear tablero con columnas predefinidas - Frontend', () => {
    test('PU-HU01F-01 - P1 - creación exitosa de tablero con afterRedo definido', async () => {
        /*
         * Objetivo:
         * Validar el camino P1 del grafo de flujo de control.
         *
         * Camino P1:
         * N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N15
         *
         * Resultado esperado:
         * El tablero se crea correctamente, se retorna la vista asociada
         * y se ejecuta afterRedo con el id del tablero creado.
         */

        // Arrange
        const teamId = 'team-hu01-angie'
        const afterRedo = jest.fn()
        const beforeUndo = jest.fn()

        const board = TestBlockFactory.createBoard()
        board.id = 'board-hu01-angie-p1'
        board.teamId = teamId

        const view = TestBlockFactory.createBoardView(board)
        view.id = 'view-hu01-angie-p1'
        view.boardId = board.id
        view.parentId = board.id

        const response = {
            boards: [board],
            blocks: [view],
        }

        /*
         * Mock:
         * Se simula la respuesta exitosa de createBoardsAndBlocks()
         * mediante FetchMock para no depender del backend real.
         */
        FetchMock.fn.mockReturnValueOnce(
            FetchMock.jsonResponse(JSON.stringify(response)),
        )

        // Act
        const result = await mutator.addEmptyBoard(
            teamId,
            intlMock,
            afterRedo,
            beforeUndo,
        )

        // Assert
        expect(FetchMock.fn).toHaveBeenCalledTimes(1)
        expect(result).toBeDefined()
        expect(result.boards).toBeDefined()
        expect(result.blocks).toBeDefined()
        expect(result.boards).toHaveLength(1)
        expect(result.blocks).toHaveLength(1)
        expect(result.boards[0].id).toBe('board-hu01-angie-p1')
        expect(result.boards[0].teamId).toBe(teamId)
        expect(result.blocks[0].id).toBe('view-hu01-angie-p1')
        expect(result.blocks[0].boardId).toBe('board-hu01-angie-p1')
        expect(result.blocks[0].parentId).toBe('board-hu01-angie-p1')
        expect(afterRedo).toHaveBeenCalledTimes(1)
        expect(afterRedo).toHaveBeenCalledWith('board-hu01-angie-p1')
    })

    test('PU-HU01F-02 - P2 - creación exitosa de tablero sin afterRedo definido', async () => {
        /*
         * Objetivo:
         * Validar el camino P2 del grafo de flujo de control.
         *
         * Camino P2:
         * N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N13-N15
         *
         * Resultado esperado:
         * El tablero se crea correctamente, pero el flujo finaliza sin ejecutar
         * afterRedo porque este parámetro es opcional.
         */

        // Arrange
        const teamId = 'team-hu01-angie'

        const board = TestBlockFactory.createBoard()
        board.id = 'board-hu01-angie-p2'
        board.teamId = teamId

        const view = TestBlockFactory.createBoardView(board)
        view.id = 'view-hu01-angie-p2'
        view.boardId = board.id
        view.parentId = board.id

        const response = {
            boards: [board],
            blocks: [view],
        }

        /*
         * Mock:
         * Se simula una respuesta correcta del servidor para validar
         * únicamente el comportamiento unitario del método addEmptyBoard().
         */
        FetchMock.fn.mockReturnValueOnce(
            FetchMock.jsonResponse(JSON.stringify(response)),
        )

        // Act
        const result = await mutator.addEmptyBoard(
            teamId,
            intlMock,
        )

        // Assert
        expect(FetchMock.fn).toHaveBeenCalledTimes(1)
        expect(result).toBeDefined()
        expect(result.boards).toBeDefined()
        expect(result.blocks).toBeDefined()
        expect(result.boards).toHaveLength(1)
        expect(result.blocks).toHaveLength(1)
        expect(result.boards[0].id).toBe('board-hu01-angie-p2')
        expect(result.boards[0].teamId).toBe(teamId)
        expect(result.blocks[0].id).toBe('view-hu01-angie-p2')
        expect(result.blocks[0].boardId).toBe('board-hu01-angie-p2')
        expect(result.blocks[0].parentId).toBe('board-hu01-angie-p2')
    })

    test('PU-HU01F-03 - P3 - error durante createBoardsAndBlocks', async () => {
        /*
         * Objetivo:
         * Validar el camino P3 del grafo de flujo de control.
         *
         * Camino P3:
         * N1-N2-N3-N4-N5-N6-N7-N8-N14-N15
         *
         * Resultado esperado:
         * Si ocurre un error durante createBoardsAndBlocks(), el error se propaga
         * y no se ejecuta afterRedo.
         */

        // Arrange
        const teamId = 'team-hu01-angie'
        const afterRedo = jest.fn()

        /*
         * Mock:
         * Se simula un error en la llamada al servidor para validar
         * el flujo alternativo de error sin depender de una falla real.
         */
        FetchMock.fn.mockRejectedValueOnce(
            new Error('Error simulado durante createBoardsAndBlocks'),
        )

        // Act + Assert
        await expect(
            mutator.addEmptyBoard(
                teamId,
                intlMock,
                afterRedo,
            ),
        ).rejects.toThrow('Error simulado durante createBoardsAndBlocks')

        expect(FetchMock.fn).toHaveBeenCalledTimes(1)
        expect(afterRedo).not.toHaveBeenCalled()
    })
})