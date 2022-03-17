package main

import (
	"archive/zip"
	"fmt"
	"os"
)

func main() {
	w, err := os.Create("./archive-generated.zip")
	if err != nil {
		panic(err)
	}
	defer w.Close()

	zw := zip.NewWriter(w)
	defer zw.Close()

	if err := writeArchiveVersion(zw); err != nil {
		panic(err)
	}

	for _, board := range generateBoards(10) {
		if err := writeArchiveBoard(zw, board); err != nil {
			panic(err)
		}
	}

	fmt.Println("FILE GENERATED")
}
