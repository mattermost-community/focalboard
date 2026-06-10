// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/*
Pruebas unitarias automatizadas backend - HU01 Angie

Historia de usuario:
Como usuario de un equipo, quiero crear un tablero nuevo con columnas predefinidas
para organizar mis tareas, de manera que pueda iniciar un proyecto rápidamente.

Archivo analizado:
server/services/store/sqlstore/boards_and_blocks.go

Función analizada:
createBoardsAndBlocks()

Herramienta:
Go test

Técnicas aplicadas según rúbrica:
- Patrón AAA: Arrange, Act, Assert.
- Principios FIRST: Fast, Independent, Repeatable, Self-validating, Timely.
- Test Double indirecto: lectura controlada del código fuente para validar estructura
  sin depender de una base de datos real.
- Aserciones claras mediante t.Errorf() y t.Fatalf().
- Cobertura por caminos independientes derivados del grafo de flujo de control.

Caminos cubiertos:
P1: Flujo exitoso con tableros y bloques.
P2: Error al insertar tablero.
P3: Error al insertar bloque.
P4: Flujo sin tableros por recorrer, pero con bloques.
P5: Flujo con tableros, pero sin bloques.

Nota:
Estas pruebas corresponden a una validación estructural de caja blanca.
Se revisa que la función conserve las instrucciones, ciclos, validaciones y retornos
necesarios para cubrir los caminos independientes definidos en el grafo de flujo de control.
*/

package sqlstore

import (
	"os"
	"strings"
	"testing"
)

/*
Test Double / apoyo de prueba:
leerCodigoHU01Backend permite cargar el archivo fuente analizado de forma controlada.
Con esto se evita depender de una base de datos real y se valida la estructura del método.
*/
func leerCodigoHU01Backend(t *testing.T) string {
	t.Helper()

	contenido, err := os.ReadFile("boards_and_blocks.go")
	if err != nil {
		t.Fatalf("No se pudo leer el archivo boards_and_blocks.go: %v", err)
	}

	return string(contenido)
}

/*
Función de apoyo:
normalizarCodigo elimina espacios, saltos de línea y tabulaciones para facilitar
la comparación de fragmentos estructurales del código.
*/
func normalizarCodigo(codigo string) string {
	codigo = strings.ReplaceAll(codigo, "\t", "")
	codigo = strings.ReplaceAll(codigo, "\n", "")
	codigo = strings.ReplaceAll(codigo, "\r", "")
	codigo = strings.ReplaceAll(codigo, " ", "")
	return codigo
}

func TestHU01Backend_P1_FlujoExitosoConTablerosYBloques(t *testing.T) {
	/*
	Objetivo:
	Validar el camino P1 del grafo de flujo de control.

	Camino P1:
	N1-N2-N3-N4-N5-N6-N7-N8-N10-N5-N11-N12-N13-N14-N16-N11-N17-N18-N19

	Resultado esperado:
	La función debe contener la estructura necesaria para recorrer tableros,
	insertar tableros, recorrer bloques, insertar bloques, construir newBab
	y retornar newBab, nil.
	*/

	// Arrange
	codigo := leerCodigoHU01Backend(t)

	validaciones := []string{
		"func (s *SQLStore) createBoardsAndBlocks",
		"boards := []*model.Board{}",
		"blocks := []*model.Block{}",
		"for _, board := range bab.Boards",
		"s.insertBoard(db, board, userID)",
		"boards = append(boards, newBoard)",
		"for _, block := range bab.Blocks",
		"s.insertBlock(db, b, userID)",
		"blocks = append(blocks, block)",
		"newBab := &model.BoardsAndBlocks",
		"return newBab, nil",
	}

	// Act + Assert
	for _, texto := range validaciones {
		if !strings.Contains(codigo, texto) {
			t.Errorf("P1 falló. No se encontró en el código la instrucción esperada: %s", texto)
		}
	}
}

func TestHU01Backend_P2_ErrorAlInsertarTablero(t *testing.T) {
	/*
	Objetivo:
	Validar el camino P2 del grafo de flujo de control.

	Camino P2:
	N1-N2-N3-N4-N5-N6-N7-N8-N9-N19

	Resultado esperado:
	Si insertBoard() retorna error, la función debe retornar nil, err
	y no continuar con el procesamiento de bloques.
	*/

	// Arrange
	codigo := normalizarCodigo(leerCodigoHU01Backend(t))
	validacion := "newBoard,err:=s.insertBoard(db,board,userID)iferr!=nil{returnnil,err}"

	// Act
	existeValidacionError := strings.Contains(codigo, validacion)

	// Assert
	if !existeValidacionError {
		t.Errorf("P2 falló. No se encontró la validación de error esperada para insertBoard().")
	}
}

func TestHU01Backend_P3_ErrorAlInsertarBloque(t *testing.T) {
	/*
	Objetivo:
	Validar el camino P3 del grafo de flujo de control.

	Camino P3:
	N1-N2-N3-N4-N5-N6-N7-N8-N10-N5-N11-N12-N13-N14-N15-N19

	Resultado esperado:
	Si insertBlock() retorna error, la función debe retornar nil, err
	y no debe completar exitosamente la creación de newBab.
	*/

	// Arrange
	codigo := normalizarCodigo(leerCodigoHU01Backend(t))
	validacion := "err:=s.insertBlock(db,b,userID)iferr!=nil{returnnil,err}"

	// Act
	existeValidacionError := strings.Contains(codigo, validacion)

	// Assert
	if !existeValidacionError {
		t.Errorf("P3 falló. No se encontró la validación de error esperada para insertBlock().")
	}
}

func TestHU01Backend_P4_FlujoSinTablerosPeroConBloques(t *testing.T) {
	/*
	Objetivo:
	Validar el camino P4 del grafo de flujo de control.

	Camino P4:
	N1-N2-N3-N4-N5-N11-N12-N13-N14-N16-N11-N17-N18-N19

	Resultado esperado:
	La estructura debe permitir que, si no existen tableros por recorrer,
	el flujo continúe hacia el ciclo de bloques.
	*/

	// Arrange
	codigo := leerCodigoHU01Backend(t)

	// Act
	posicionCicloBoards := strings.Index(codigo, "for _, board := range bab.Boards")
	posicionCicloBlocks := strings.Index(codigo, "for _, block := range bab.Blocks")
	existeAppendBlocks := strings.Contains(codigo, "blocks = append(blocks, block)")

	// Assert
	if posicionCicloBoards == -1 {
		t.Fatalf("P4 falló. No se encontró el ciclo de tableros bab.Boards.")
	}

	if posicionCicloBlocks == -1 {
		t.Fatalf("P4 falló. No se encontró el ciclo de bloques bab.Blocks.")
	}

	if posicionCicloBlocks <= posicionCicloBoards {
		t.Errorf("P4 falló. El ciclo de bloques debería aparecer después del ciclo de tableros.")
	}

	if !existeAppendBlocks {
		t.Errorf("P4 falló. No se encontró la inserción de bloques en la lista blocks.")
	}
}

func TestHU01Backend_P5_FlujoConTablerosPeroSinBloques(t *testing.T) {
	/*
	Objetivo:
	Validar el camino P5 del grafo de flujo de control.

	Camino P5:
	N1-N2-N3-N4-N5-N6-N7-N8-N10-N5-N11-N17-N18-N19

	Resultado esperado:
	La estructura debe permitir que, si no existen bloques por recorrer,
	la función continúe con la creación de newBab y retorne la estructura final.
	*/

	// Arrange
	codigo := leerCodigoHU01Backend(t)

	// Act
	posicionCicloBlocks := strings.Index(codigo, "for _, block := range bab.Blocks")
	posicionNewBab := strings.Index(codigo, "newBab := &model.BoardsAndBlocks")
	existeAsignacionBoards := strings.Contains(codigo, "Boards: boards")
	existeAsignacionBlocks := strings.Contains(codigo, "Blocks: blocks")

	// Assert
	if posicionCicloBlocks == -1 {
		t.Fatalf("P5 falló. No se encontró el ciclo de bloques bab.Blocks.")
	}

	if posicionNewBab == -1 {
		t.Fatalf("P5 falló. No se encontró la creación de newBab.")
	}

	if posicionNewBab <= posicionCicloBlocks {
		t.Errorf("P5 falló. La creación de newBab debe ocurrir después del ciclo de bloques.")
	}

	if !existeAsignacionBoards {
		t.Errorf("P5 falló. No se encontró la asignación de boards dentro de newBab.")
	}

	if !existeAsignacionBlocks {
		t.Errorf("P5 falló. No se encontró la asignación de blocks dentro de newBab.")
	}
}