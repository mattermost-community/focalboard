//go:generate go-bindata -prefix postgres_files/ -pkg postgres -o postgres/bindata.go ./postgres_files
//go:generate go-bindata -prefix sqlite_files/ -pkg sqlite -o sqlite/bindata.go ./sqlite_files
package migrations
