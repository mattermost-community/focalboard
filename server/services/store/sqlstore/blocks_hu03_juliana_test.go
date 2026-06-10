// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/*
Pruebas unitarias automatizadas backend - HU03 Juliana

Historia de usuario:
Como usuario, quiero mover tareas entre columnas arrastrando y soltando,
para actualizar su estado de “Pendientes” a “En proceso” o “Terminadas”
de manera visual y rápida.

Archivos analizados:
- server/services/store/sqlstore/blocks.go
- server/services/store/sqlstore/public_methods.go

Funciones analizadas:
- patchBlock()
- patchBlocks()
- PatchBlock()
- PatchBlocks()

Herramienta:
Go test

Técnicas aplicadas según rúbrica:
- Patrón AAA: Arrange, Act, Assert.
- Principios FIRST: Fast, Independent, Repeatable, Self-validating, Timely.
- Test Double indirecto: lectura controlada de archivos fuente para validar estructura
  sin depender de una base de datos real.
- Aserciones claras mediante t.Errorf() y t.Fatalf().
- Cobertura por caminos independientes derivados del grafo de flujo de control backend.

Caminos cubiertos:
P1: Actualización de un bloque usando SQLite sin errores.
P2: Error al iniciar transacción en PatchBlock().
P3: Error al obtener bloque en patchBlock().
P4: Error durante rollback en PatchBlock().
P5: Error durante commit en PatchBlock().
P6: Actualización exitosa de un bloque con transacción.
P7: Actualización de varios bloques usando SQLite.
P8: Error al iniciar transacción en PatchBlocks().
P9: Error al actualizar un bloque dentro del lote.
P10: Error durante rollback en PatchBlocks().
P11: Error durante commit en PatchBlocks().
P12: Actualización exitosa de varios bloques con transacción.

Objetivo:
Validar estructuralmente que el backend contiene la lógica necesaria para aplicar
actualizaciones parciales sobre bloques, manejar lotes de actualización, controlar
transacciones, rollback, commit y errores. Esta lógica soporta la persistencia de
cambios generados por el movimiento de tarjetas mediante drag and drop.
*/

package sqlstore

import (
	"os"
	"strings"
	"testing"
)

/*
Test Double / apoyo de prueba:
leerArchivoHU03Backend permite cargar archivos fuente de manera controlada.
Con esto se valida la estructura del código sin depender de una base de datos real
ni de una ejecución completa del backend.
*/
func leerArchivoHU03Backend(t *testing.T, ruta string) string {
	t.Helper()

	contenido, err := os.ReadFile(ruta)
	if err != nil {
		t.Fatalf("No se pudo leer el archivo %s: %v", ruta, err)
	}

	return string(contenido)
}

/*
Función de apoyo:
normalizarCodigoHU03Backend elimina espacios, saltos de línea y tabulaciones.
Esto permite comparar fragmentos estructurales sin que el formato afecte la prueba.
*/
func normalizarCodigoHU03Backend(codigo string) string {
	codigo = strings.ReplaceAll(codigo, " ", "")
	codigo = strings.ReplaceAll(codigo, "\n", "")
	codigo = strings.ReplaceAll(codigo, "\r", "")
	codigo = strings.ReplaceAll(codigo, "\t", "")
	return codigo
}

func TestHU03JulianaBackendPatchBlockYPatchBlocks(t *testing.T) {
	/*
	Objetivo general:
	Validar las funciones internas patchBlock() y patchBlocks(), encargadas de
	aplicar directamente las actualizaciones parciales sobre uno o varios bloques.
	*/

	// Arrange
	codigo := leerArchivoHU03Backend(t, "blocks.go")
	codigoNormalizado := normalizarCodigoHU03Backend(codigo)

	t.Run("PU-HU03B-01 - P1 - Validar existencia de patchBlock", func(t *testing.T) {
		/*
		Objetivo:
		Validar que exista la función interna patchBlock() y que contenga
		la secuencia necesaria para obtener el bloque, aplicar el patch y persistirlo.

		Resultado esperado:
		patchBlock() debe obtener el bloque existente, aplicar blockPatch.Patch()
		y guardar el bloque actualizado mediante insertBlock().
		*/

		// Arrange
		validaciones := []string{
			"func(s*SQLStore)patchBlock(",
			"existingBlock,err:=s.getBlock(db,blockID)",
			"iferr!=nil{returnerr}",
			"block:=blockPatch.Patch(existingBlock)",
			"returns.insertBlock(db,block,userID)",
		}

		// Act + Assert
		for _, validacion := range validaciones {
			if !strings.Contains(codigoNormalizado, validacion) {
				t.Errorf("PU-HU03B-01 falló. No se encontró la validación esperada en patchBlock: %s", validacion)
			}
		}
	})

	t.Run("PU-HU03B-02 - P7 - Validar existencia de patchBlocks", func(t *testing.T) {
		/*
		Objetivo:
		Validar que exista la función interna patchBlocks() y que recorra
		los identificadores de bloques recibidos en lote.

		Resultado esperado:
		patchBlocks() debe recorrer blockPatches.BlockIDs, llamar a patchBlock()
		por cada bloque y retornar error si alguna actualización falla.
		*/

		// Arrange
		validaciones := []string{
			"func(s*SQLStore)patchBlocks(",
			"fori,blockID:=rangeblockPatches.BlockIDs",
			"err:=s.patchBlock(db,blockID,&blockPatches.BlockPatches[i],userID)",
			"iferr!=nil{returnerr}",
			"returnnil",
		}

		// Act + Assert
		for _, validacion := range validaciones {
			if !strings.Contains(codigoNormalizado, validacion) {
				t.Errorf("PU-HU03B-02 falló. No se encontró la validación esperada en patchBlocks: %s", validacion)
			}
		}
	})

	t.Run("PU-HU03B-03 - P3 - Validar que patchBlock obtiene el bloque antes de actualizar", func(t *testing.T) {
		/*
		Objetivo:
		Validar que patchBlock() consulte el bloque existente antes de aplicar cambios.

		Resultado esperado:
		Debe existir el llamado a getBlock().
		*/

		// Arrange
		validacion := "existingBlock,err:=s.getBlock(db,blockID)"

		// Act
		existeGetBlock := strings.Contains(codigoNormalizado, validacion)

		// Assert
		if !existeGetBlock {
			t.Errorf("PU-HU03B-03 falló. patchBlock no obtiene el bloque existente antes de aplicar el patch.")
		}
	})

	t.Run("PU-HU03B-04 - P1 - Validar que patchBlock aplica el patch sobre el bloque existente", func(t *testing.T) {
		/*
		Objetivo:
		Validar que el patch se aplique sobre el bloque existente.

		Resultado esperado:
		Debe existir blockPatch.Patch(existingBlock).
		*/

		// Arrange
		validacion := "block:=blockPatch.Patch(existingBlock)"

		// Act
		existePatch := strings.Contains(codigoNormalizado, validacion)

		// Assert
		if !existePatch {
			t.Errorf("PU-HU03B-04 falló. patchBlock no aplica el patch sobre el bloque existente.")
		}
	})

	t.Run("PU-HU03B-05 - P1 - Validar que patchBlock persiste el bloque actualizado", func(t *testing.T) {
		/*
		Objetivo:
		Validar que el bloque actualizado sea guardado en el almacenamiento.

		Resultado esperado:
		Debe existir el llamado a insertBlock().
		*/

		// Arrange
		validacion := "returns.insertBlock(db,block,userID)"

		// Act
		existeInsertBlock := strings.Contains(codigoNormalizado, validacion)

		// Assert
		if !existeInsertBlock {
			t.Errorf("PU-HU03B-05 falló. patchBlock no persiste el bloque actualizado mediante insertBlock.")
		}
	})

	t.Run("PU-HU03B-06 - P7 - Validar que patchBlocks recorre todos los IDs del lote", func(t *testing.T) {
		/*
		Objetivo:
		Validar que patchBlocks() recorra los bloques recibidos en lote.

		Resultado esperado:
		Debe existir el ciclo sobre blockPatches.BlockIDs.
		*/

		// Arrange
		validacion := "fori,blockID:=rangeblockPatches.BlockIDs"

		// Act
		existeCiclo := strings.Contains(codigoNormalizado, validacion)

		// Assert
		if !existeCiclo {
			t.Errorf("PU-HU03B-06 falló. patchBlocks no recorre los blockIDs del lote.")
		}
	})

	t.Run("PU-HU03B-07 - P9 - Validar que patchBlocks detiene el ciclo si ocurre error", func(t *testing.T) {
		/*
		Objetivo:
		Validar que patchBlocks() detenga el procesamiento del lote si patchBlock() falla.

		Resultado esperado:
		Debe existir una validación err != nil con retorno del error.
		*/

		// Arrange
		validacion := "iferr!=nil{returnerr}"

		// Act
		existeControlError := strings.Contains(codigoNormalizado, validacion)

		// Assert
		if !existeControlError {
			t.Errorf("PU-HU03B-07 falló. patchBlocks no contiene validación para detener el ciclo cuando ocurre error.")
		}
	})
}

func TestHU03JulianaBackendPatchBlockPublicMethods(t *testing.T) {
	/*
	Objetivo general:
	Validar los métodos públicos PatchBlock() y PatchBlocks(), encargados de
	coordinar el flujo de actualización con SQLite o con transacciones, rollback y commit.
	*/

	// Arrange
	codigo := leerArchivoHU03Backend(t, "public_methods.go")
	codigoNormalizado := normalizarCodigoHU03Backend(codigo)

	t.Run("PU-HU03B-08 - P2, P5, P6 - Validar flujo público PatchBlock", func(t *testing.T) {
		/*
		Objetivo:
		Validar la estructura general de PatchBlock() para actualización individual.

		Resultado esperado:
		PatchBlock() debe contemplar SQLite, transacción, error al iniciar transacción,
		rollback, commit y retorno exitoso.
		*/

		// Arrange
		validaciones := []string{
			"func(s*SQLStore)PatchBlock(",
			"ifs.dbType==model.SqliteDBType",
			"returns.patchBlock(s.db,blockID,blockPatch,userID)",
			"tx,txErr:=s.db.BeginTx(context.Background(),nil)",
			"iftxErr!=nil{returntxErr}",
			"err:=s.patchBlock(tx,blockID,blockPatch,userID)",
			"iferr!=nil{",
			"tx.Rollback()",
			"tx.Commit()",
			"returnnil",
		}

		// Act + Assert
		for _, validacion := range validaciones {
			if !strings.Contains(codigoNormalizado, validacion) {
				t.Errorf("PU-HU03B-08 falló. No se encontró la validación esperada en PatchBlock: %s", validacion)
			}
		}
	})

	t.Run("PU-HU03B-09 - P8, P11, P12 - Validar flujo público PatchBlocks", func(t *testing.T) {
		/*
		Objetivo:
		Validar la estructura general de PatchBlocks() para actualización por lote.

		Resultado esperado:
		PatchBlocks() debe contemplar SQLite, transacción, error al iniciar transacción,
		rollback, commit y retorno exitoso.
		*/

		// Arrange
		validaciones := []string{
			"func(s*SQLStore)PatchBlocks(",
			"ifs.dbType==model.SqliteDBType",
			"returns.patchBlocks(s.db,blockPatches,userID)",
			"tx,txErr:=s.db.BeginTx(context.Background(),nil)",
			"iftxErr!=nil{returntxErr}",
			"err:=s.patchBlocks(tx,blockPatches,userID)",
			"iferr!=nil{",
			"tx.Rollback()",
			"tx.Commit()",
			"returnnil",
		}

		// Act + Assert
		for _, validacion := range validaciones {
			if !strings.Contains(codigoNormalizado, validacion) {
				t.Errorf("PU-HU03B-09 falló. No se encontró la validación esperada en PatchBlocks: %s", validacion)
			}
		}
	})

	t.Run("PU-HU03B-10 - P1 - Validar que PatchBlock maneja SQLite sin transacción manual", func(t *testing.T) {
		/*
		Objetivo:
		Validar el camino directo de PatchBlock() cuando se utiliza SQLite.

		Resultado esperado:
		PatchBlock() debe llamar directamente a patchBlock() usando s.db.
		*/

		// Arrange
		validacion := "returns.patchBlock(s.db,blockID,blockPatch,userID)"

		// Act
		existeFlujoSQLite := strings.Contains(codigoNormalizado, validacion)

		// Assert
		if !existeFlujoSQLite {
			t.Errorf("PU-HU03B-10 falló. PatchBlock no contiene el llamado directo a patchBlock para SQLite.")
		}
	})

	t.Run("PU-HU03B-11 - P7 - Validar que PatchBlocks maneja SQLite sin transacción manual", func(t *testing.T) {
		/*
		Objetivo:
		Validar el camino directo de PatchBlocks() cuando se utiliza SQLite.

		Resultado esperado:
		PatchBlocks() debe llamar directamente a patchBlocks() usando s.db.
		*/

		// Arrange
		validacion := "returns.patchBlocks(s.db,blockPatches,userID)"

		// Act
		existeFlujoSQLite := strings.Contains(codigoNormalizado, validacion)

		// Assert
		if !existeFlujoSQLite {
			t.Errorf("PU-HU03B-11 falló. PatchBlocks no contiene el llamado directo a patchBlocks para SQLite.")
		}
	})

	t.Run("PU-HU03B-12 - P4, P10 - Validar manejo de rollback y commit", func(t *testing.T) {
		/*
		Objetivo:
		Validar que el backend contemple manejo transaccional cuando ocurre error
		o cuando la operación se confirma correctamente.

		Resultado esperado:
		Deben existir rollback, commit y registro de error transaccional.
		*/

		// Arrange
		validaciones := []string{
			"tx.Rollback()",
			"tx.Commit()",
			"s.logger.Error(\"transactionrollbackerror\"",
		}

		// Act + Assert
		for _, validacion := range validaciones {
			if !strings.Contains(codigoNormalizado, validacion) {
				t.Errorf("PU-HU03B-12 falló. No se encontró manejo de transacción esperado: %s", validacion)
			}
		}
	})
}