// Code generated by go-bindata. DO NOT EDIT.
// sources:
// postgres_files/000001_init.down.sql (30B)
// postgres_files/000001_init.up.sql (279B)
// postgres_files/000002_system_settings_table.down.sql (39B)
// postgres_files/000002_system_settings_table.up.sql (108B)
// postgres_files/000003_blocks_rootid.down.sql (51B)
// postgres_files/000003_blocks_rootid.up.sql (62B)
// postgres_files/000004_auth_table.down.sql (61B)
// postgres_files/000004_auth_table.up.sql (513B)
// postgres_files/000005_blocks_modifiedby.down.sql (55B)
// postgres_files/000005_blocks_modifiedby.up.sql (66B)
// postgres_files/000006_sharing_table.down.sql (31B)
// postgres_files/000006_sharing_table.up.sql (170B)
// postgres_files/000007_workspaces_table.down.sql (34B)
// postgres_files/000007_workspaces_table.up.sql (190B)
// postgres_files/000008_teams.down.sql (173B)
// postgres_files/000008_teams.up.sql (304B)

package postgres

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func bindataRead(data []byte, name string) ([]byte, error) {
	gz, err := gzip.NewReader(bytes.NewBuffer(data))
	if err != nil {
		return nil, fmt.Errorf("read %q: %w", name, err)
	}

	var buf bytes.Buffer
	_, err = io.Copy(&buf, gz)
	clErr := gz.Close()

	if err != nil {
		return nil, fmt.Errorf("read %q: %w", name, err)
	}
	if clErr != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

type asset struct {
	bytes  []byte
	info   os.FileInfo
	digest [sha256.Size]byte
}

type bindataFileInfo struct {
	name    string
	size    int64
	mode    os.FileMode
	modTime time.Time
}

func (fi bindataFileInfo) Name() string {
	return fi.name
}
func (fi bindataFileInfo) Size() int64 {
	return fi.size
}
func (fi bindataFileInfo) Mode() os.FileMode {
	return fi.mode
}
func (fi bindataFileInfo) ModTime() time.Time {
	return fi.modTime
}
func (fi bindataFileInfo) IsDir() bool {
	return false
}
func (fi bindataFileInfo) Sys() interface{} {
	return nil
}

var __000001_initDownSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x09\xf2\x0f\x50\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x4d\xca\xc9\x4f\xce\x2e\xb6\xe6\x02\x04\x00\x00\xff\xff\x2d\x73\xd0\xe1\x1e\x00\x00\x00")

func _000001_initDownSqlBytes() ([]byte, error) {
	return bindataRead(
		__000001_initDownSql,
		"000001_init.down.sql",
	)
}

func _000001_initDownSql() (*asset, error) {
	bytes, err := _000001_initDownSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000001_init.down.sql", size: 30, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0xc3, 0xa, 0x75, 0x74, 0x21, 0x4f, 0xed, 0x29, 0xf4, 0xfb, 0x14, 0x9a, 0xda, 0x7a, 0x6c, 0x3b, 0x58, 0x34, 0x7c, 0xcd, 0x48, 0xf4, 0x9, 0x5c, 0x96, 0xa1, 0xb9, 0xb2, 0x43, 0xfd, 0x76, 0xa2}}
	return a, nil
}

var __000001_initUpSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x64\x8f\x41\x4b\xc3\x40\x10\x85\xcf\xd9\x5f\xf1\x8e\x09\x04\x2f\x82\x17\x4f\xdb\x3a\xd5\xd5\x64\x53\x36\x53\x6d\xbd\x94\x98\x9d\xe2\x62\xac\x21\x59\x41\x29\xfd\xef\xd2\x1e\x72\xa8\xb7\x99\x8f\x99\xef\xf1\xe6\x8e\x34\x13\x58\xcf\x0a\x82\x59\xc0\x56\x0c\x5a\x9b\x9a\x6b\x1c\x0e\x57\xfd\x20\xbb\xf0\x73\x3c\xbe\x75\x5f\xed\xc7\x88\x54\x25\xc1\xe3\x59\xbb\xf9\x83\x76\xe9\xf5\x4d\x96\xab\x24\xec\x47\x19\xe2\xb6\x89\x60\x53\x52\xcd\xba\x5c\xf2\xeb\x59\x63\x57\x45\x81\x3b\x5a\xe8\x55\xc1\xb0\xd5\x4b\x7a\x3a\xef\x9b\x41\xf6\x71\xfb\x4f\x33\xb6\xef\xf2\xd9\x60\x66\xee\x8d\xe5\x5c\x25\xf1\xb7\x17\x30\xad\xcf\x73\x88\xdd\xb4\xec\x82\x74\x7e\xc4\x63\x5d\xd9\x5c\x25\xed\x20\x4d\x94\x53\xfa\xf4\xf9\xdd\xfb\x4b\xe4\xa5\x93\x0b\xb4\x74\xa6\xd4\x6e\x83\x27\xda\x20\x0d\x3e\xc7\xd4\x23\x53\xd9\xad\xfa\x0b\x00\x00\xff\xff\x7d\xc7\x05\x5c\x17\x01\x00\x00")

func _000001_initUpSqlBytes() ([]byte, error) {
	return bindataRead(
		__000001_initUpSql,
		"000001_init.up.sql",
	)
}

func _000001_initUpSql() (*asset, error) {
	bytes, err := _000001_initUpSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000001_init.up.sql", size: 279, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x2d, 0x43, 0xe4, 0x6a, 0x26, 0x2d, 0xf8, 0x20, 0xf3, 0x64, 0x19, 0x6e, 0x26, 0x26, 0xf2, 0x4e, 0x2d, 0xa0, 0xb9, 0xf0, 0x34, 0x0, 0x38, 0x5f, 0xf2, 0xa4, 0x12, 0x3c, 0x27, 0x59, 0xfe, 0x41}}
	return a, nil
}

var __000002_system_settings_tableDownSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x09\xf2\x0f\x50\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x2d\xae\x2c\x2e\x49\xcd\x8d\x2f\x4e\x2d\x29\xc9\xcc\x4b\x2f\xb6\xe6\x02\x04\x00\x00\xff\xff\xd2\x63\x5d\x39\x27\x00\x00\x00")

func _000002_system_settings_tableDownSqlBytes() ([]byte, error) {
	return bindataRead(
		__000002_system_settings_tableDownSql,
		"000002_system_settings_table.down.sql",
	)
}

func _000002_system_settings_tableDownSql() (*asset, error) {
	bytes, err := _000002_system_settings_tableDownSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000002_system_settings_table.down.sql", size: 39, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x28, 0x3, 0x29, 0x5d, 0x28, 0xad, 0x1c, 0x15, 0xd, 0x2e, 0x84, 0xc8, 0xda, 0x3a, 0xd, 0x2f, 0xd8, 0x1e, 0xd1, 0x7f, 0xa1, 0xa1, 0x8d, 0x8b, 0xf3, 0x71, 0xa5, 0xc, 0x2d, 0x3a, 0x61, 0x62}}
	return a, nil
}

var __000002_system_settings_tableUpSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x0e\x72\x75\x0c\x71\x55\x08\x71\x74\xf2\x71\x55\xf0\x74\x53\xf0\xf3\x0f\x51\x70\x8d\xf0\x0c\x0e\x09\x56\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x2d\xae\x2c\x2e\x49\xcd\x8d\x2f\x4e\x2d\x29\xc9\xcc\x4b\x2f\x56\xd0\xe0\xe2\xcc\x4c\x51\x08\x73\x0c\x72\xf6\x70\x0c\xd2\x30\x34\x30\xd0\xd4\xe1\xe2\x2c\x4b\xcc\x29\x4d\x55\x08\x71\x8d\x08\xd1\xe1\xe2\x0c\x08\xf2\xf4\x75\x0c\x8a\x54\xf0\x76\x8d\x54\xd0\xc8\x4c\xd1\xe4\xd2\xb4\xe6\x02\x04\x00\x00\xff\xff\xe4\x3d\xdb\x86\x6c\x00\x00\x00")

func _000002_system_settings_tableUpSqlBytes() ([]byte, error) {
	return bindataRead(
		__000002_system_settings_tableUpSql,
		"000002_system_settings_table.up.sql",
	)
}

func _000002_system_settings_tableUpSql() (*asset, error) {
	bytes, err := _000002_system_settings_tableUpSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000002_system_settings_table.up.sql", size: 108, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0xd3, 0xc5, 0xab, 0xe8, 0x30, 0x86, 0xbd, 0x6d, 0x70, 0x20, 0x8b, 0xc1, 0x7d, 0xc, 0xfa, 0xba, 0x3a, 0x71, 0x4b, 0xb7, 0x97, 0x5f, 0x39, 0x46, 0xa8, 0x50, 0x2f, 0x90, 0xfb, 0x1d, 0x45, 0xc}}
	return a, nil
}

var __000003_blocks_rootidDownSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\xf4\x09\x71\x0d\x52\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x4d\xca\xc9\x4f\xce\x2e\xe6\x72\x09\xf2\x0f\x50\x70\xf6\xf7\x09\xf5\xf5\x53\x28\xca\xcf\x2f\x89\xcf\x4c\xb1\xe6\x02\x04\x00\x00\xff\xff\x51\xe5\xe2\x3a\x33\x00\x00\x00")

func _000003_blocks_rootidDownSqlBytes() ([]byte, error) {
	return bindataRead(
		__000003_blocks_rootidDownSql,
		"000003_blocks_rootid.down.sql",
	)
}

func _000003_blocks_rootidDownSql() (*asset, error) {
	bytes, err := _000003_blocks_rootidDownSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000003_blocks_rootid.down.sql", size: 51, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0xdb, 0xfc, 0x77, 0x1b, 0xf7, 0x2e, 0x8c, 0xe9, 0x96, 0x14, 0x46, 0xde, 0xdc, 0x63, 0x52, 0x28, 0x40, 0xa6, 0x92, 0xda, 0x8c, 0x1, 0x31, 0x7, 0xa6, 0x61, 0x8a, 0x57, 0x6c, 0x58, 0x88, 0xe3}}
	return a, nil
}

var __000003_blocks_rootidUpSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\xf4\x09\x71\x0d\x52\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x4d\xca\xc9\x4f\xce\x2e\xe6\x72\x74\x71\x51\x70\xf6\xf7\x09\xf5\xf5\x53\x28\xca\xcf\x2f\x89\xcf\x4c\x51\x08\x73\x0c\x72\xf6\x70\x0c\xd2\x30\x36\xd3\xb4\xe6\x02\x04\x00\x00\xff\xff\xc2\x68\x66\x83\x3e\x00\x00\x00")

func _000003_blocks_rootidUpSqlBytes() ([]byte, error) {
	return bindataRead(
		__000003_blocks_rootidUpSql,
		"000003_blocks_rootid.up.sql",
	)
}

func _000003_blocks_rootidUpSql() (*asset, error) {
	bytes, err := _000003_blocks_rootidUpSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000003_blocks_rootid.up.sql", size: 62, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0xe1, 0x4c, 0xe5, 0xb, 0xa4, 0x83, 0xfc, 0x49, 0x39, 0x1d, 0x5b, 0xd0, 0xcf, 0xa3, 0x5e, 0x1f, 0x5c, 0x90, 0x97, 0x13, 0x1c, 0xcc, 0xd3, 0x6f, 0x3f, 0xa5, 0x6, 0x67, 0xfd, 0x4d, 0xc0, 0x55}}
	return a, nil
}

var __000004_auth_tableDownSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x09\xf2\x0f\x50\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x2d\x2d\x4e\x2d\x2a\xb6\xe6\xc2\x2e\x59\x9c\x5a\x5c\x9c\x99\x9f\x57\x6c\xcd\x05\x08\x00\x00\xff\xff\xb6\xc1\x44\xa1\x3d\x00\x00\x00")

func _000004_auth_tableDownSqlBytes() ([]byte, error) {
	return bindataRead(
		__000004_auth_tableDownSql,
		"000004_auth_table.down.sql",
	)
}

func _000004_auth_tableDownSql() (*asset, error) {
	bytes, err := _000004_auth_tableDownSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000004_auth_table.down.sql", size: 61, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x7a, 0xd8, 0xba, 0x1, 0x9f, 0x51, 0xfb, 0x45, 0xd8, 0x3, 0xd8, 0xf7, 0x73, 0xee, 0x74, 0x38, 0x32, 0x52, 0x74, 0x99, 0xb7, 0xda, 0xc6, 0x7c, 0xcb, 0xe1, 0x68, 0x6a, 0x88, 0xea, 0x82, 0x70}}
	return a, nil
}

var __000004_auth_tableUpSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\xa4\x90\x4f\x4b\xc3\x40\x10\xc5\xcf\xd9\x4f\x31\xc7\x04\x8a\xd4\x42\x4f\x9e\xb6\x65\xd5\xf5\x4f\x2a\x9b\x45\xec\x29\x0c\xd9\x29\x2e\x36\x7f\xd8\xd9\xaa\x50\xfa\xdd\x25\x08\x16\x92\x08\x82\x73\xfc\xbd\x61\xde\xbc\xb7\x36\x4a\x5a\x05\x56\xae\x1e\x14\xe8\x6b\xc8\x37\x16\xd4\x8b\x2e\x6c\x01\xc7\xe3\x45\x17\x68\xe7\x3f\x4f\xa7\x03\x53\x60\x48\x45\xe2\x1d\x3c\x4b\xb3\xbe\x95\x26\xbd\x9c\xcf\xb3\x99\x48\x7a\xa9\xc1\x9a\x86\x9c\x6a\xf4\xfb\x1f\xb8\x58\x2e\x7b\xd8\x21\xf3\x47\x1b\x46\x47\xea\x1d\x96\x4c\x55\xa0\x38\x54\xf0\x10\x5f\x4b\xa6\xf0\xee\xab\xb3\xc5\xe2\x2c\x39\x8c\x38\x72\x09\x6d\xc7\xf0\x3d\x77\xc5\x26\x9f\x89\xa4\x0a\x84\x91\x4a\x8c\x3d\x5b\xe9\x1b\x9d\xdb\xfe\xf7\xce\x4d\x50\x47\x7b\x1a\xd3\x27\xa3\x1f\xa5\xd9\xc2\xbd\xda\x42\xea\x5d\x26\xb2\x2b\x21\xfe\xd6\x1e\x13\xb3\x6f\x9b\x5f\x0a\x8c\xed\x1b\x35\x53\xad\x96\xe3\xdd\x7f\x26\x9b\xca\xf0\x15\x00\x00\xff\xff\x70\x02\x9e\x3b\x01\x02\x00\x00")

func _000004_auth_tableUpSqlBytes() ([]byte, error) {
	return bindataRead(
		__000004_auth_tableUpSql,
		"000004_auth_table.up.sql",
	)
}

func _000004_auth_tableUpSql() (*asset, error) {
	bytes, err := _000004_auth_tableUpSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000004_auth_table.up.sql", size: 513, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x9b, 0x66, 0xc6, 0xd0, 0x32, 0xbc, 0x36, 0x8c, 0x72, 0x58, 0x10, 0x87, 0x56, 0xb4, 0x5c, 0xe1, 0xc9, 0xfc, 0x37, 0x2c, 0xad, 0x4f, 0x9d, 0xfd, 0x88, 0xd3, 0xb5, 0x6e, 0x6b, 0x86, 0x77, 0x4c}}
	return a, nil
}

var __000005_blocks_modifiedbyDownSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\xf4\x09\x71\x0d\x52\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x4d\xca\xc9\x4f\xce\x2e\xe6\x72\x09\xf2\x0f\x50\x70\xf6\xf7\x09\xf5\xf5\x53\xc8\xcd\x4f\xc9\x4c\xcb\x4c\x4d\x89\x4f\xaa\xb4\xe6\x02\x04\x00\x00\xff\xff\x6a\xfe\x38\x0a\x37\x00\x00\x00")

func _000005_blocks_modifiedbyDownSqlBytes() ([]byte, error) {
	return bindataRead(
		__000005_blocks_modifiedbyDownSql,
		"000005_blocks_modifiedby.down.sql",
	)
}

func _000005_blocks_modifiedbyDownSql() (*asset, error) {
	bytes, err := _000005_blocks_modifiedbyDownSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000005_blocks_modifiedby.down.sql", size: 55, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x76, 0x4b, 0x62, 0xaa, 0x59, 0xd0, 0x49, 0xb4, 0x9f, 0x2e, 0xfd, 0xe7, 0xad, 0x59, 0x4b, 0xb7, 0x8d, 0x94, 0xa2, 0x87, 0x42, 0xd3, 0x68, 0xc9, 0x61, 0x59, 0x8d, 0x68, 0xff, 0x3b, 0xd5, 0xdb}}
	return a, nil
}

var __000005_blocks_modifiedbyUpSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\xf4\x09\x71\x0d\x52\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x4d\xca\xc9\x4f\xce\x2e\xe6\x72\x74\x71\x51\x70\xf6\xf7\x09\xf5\xf5\x53\xc8\xcd\x4f\xc9\x4c\xcb\x4c\x4d\x89\x4f\xaa\x54\x08\x73\x0c\x72\xf6\x70\x0c\xd2\x30\x36\xd3\xb4\xe6\x02\x04\x00\x00\xff\xff\x30\x55\xd2\xd8\x42\x00\x00\x00")

func _000005_blocks_modifiedbyUpSqlBytes() ([]byte, error) {
	return bindataRead(
		__000005_blocks_modifiedbyUpSql,
		"000005_blocks_modifiedby.up.sql",
	)
}

func _000005_blocks_modifiedbyUpSql() (*asset, error) {
	bytes, err := _000005_blocks_modifiedbyUpSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000005_blocks_modifiedby.up.sql", size: 66, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x8e, 0x1, 0xd8, 0x3, 0x3a, 0xc0, 0x92, 0x34, 0xa8, 0xd, 0x85, 0x3, 0x86, 0x9c, 0x16, 0x13, 0x2f, 0x83, 0xc7, 0x70, 0xed, 0xcb, 0x63, 0xca, 0xba, 0xd5, 0x94, 0x99, 0x39, 0xfd, 0xf8, 0x35}}
	return a, nil
}

var __000006_sharing_tableDownSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x09\xf2\x0f\x50\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x2d\xce\x48\x2c\xca\xcc\x4b\xb7\xe6\x02\x04\x00\x00\xff\xff\x7a\x74\xe5\xab\x1f\x00\x00\x00")

func _000006_sharing_tableDownSqlBytes() ([]byte, error) {
	return bindataRead(
		__000006_sharing_tableDownSql,
		"000006_sharing_table.down.sql",
	)
}

func _000006_sharing_tableDownSql() (*asset, error) {
	bytes, err := _000006_sharing_tableDownSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000006_sharing_table.down.sql", size: 31, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x31, 0x98, 0x81, 0xe, 0xc8, 0x13, 0xd0, 0x6a, 0x21, 0xec, 0x11, 0x2b, 0x65, 0x78, 0x8b, 0x69, 0x2e, 0x94, 0xa2, 0xe7, 0xf9, 0xc4, 0xbd, 0x18, 0xfc, 0x2, 0x2, 0x5b, 0xc5, 0xdc, 0x78, 0x38}}
	return a, nil
}

var __000006_sharing_tableUpSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x5c\xcc\x41\x0b\x82\x30\x14\x00\xe0\xf3\xf6\x2b\xde\x51\x41\xc2\x08\xba\x74\x9a\xb2\x6a\x64\x1a\x73\x44\x9e\x64\xb2\x67\x3d\x2a\x15\x33\x28\xc4\xff\x1e\x5d\x3a\x74\xff\xf8\x62\x2d\x85\x91\x60\x44\x94\x48\x50\x6b\x48\x33\x03\xf2\xa4\x72\x93\xc3\x38\xce\xba\x1e\x6b\x7a\x4d\xd3\xe3\x62\x7b\x6a\xce\xe0\x71\x46\x0e\x8e\x42\xc7\x5b\xa1\xbd\xc5\xd2\x0f\x38\xc3\xc6\x56\x37\x74\x10\x65\x59\x22\x45\x1a\x70\x36\xb4\x57\x6c\x7e\x6a\x1e\x86\x5f\x76\x6f\x1d\xd5\x84\xae\xac\xde\x7f\xc1\xb3\x73\x76\xc0\xd2\x0e\x10\xa9\x8d\x4a\x4d\xc0\xd9\x41\xab\xbd\xd0\x05\xec\x64\x01\x1e\x39\x9f\xfb\x2b\xfe\x09\x00\x00\xff\xff\x7b\xf0\x53\xc5\xaa\x00\x00\x00")

func _000006_sharing_tableUpSqlBytes() ([]byte, error) {
	return bindataRead(
		__000006_sharing_tableUpSql,
		"000006_sharing_table.up.sql",
	)
}

func _000006_sharing_tableUpSql() (*asset, error) {
	bytes, err := _000006_sharing_tableUpSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000006_sharing_table.up.sql", size: 170, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x35, 0xdc, 0x29, 0xae, 0x1f, 0xe1, 0x7f, 0xf5, 0x9, 0xa0, 0xb3, 0x72, 0x3c, 0xbe, 0x7e, 0x40, 0x9c, 0x8d, 0xab, 0x6c, 0x1a, 0x71, 0xf1, 0xaa, 0x4d, 0x17, 0x7c, 0x23, 0xf1, 0x52, 0x78, 0x88}}
	return a, nil
}

var __000007_workspaces_tableDownSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x09\xf2\x0f\x50\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x2d\xcf\x2f\xca\x2e\x2e\x48\x4c\x4e\x2d\xb6\xe6\x02\x04\x00\x00\xff\xff\x1a\xe4\xe6\x36\x22\x00\x00\x00")

func _000007_workspaces_tableDownSqlBytes() ([]byte, error) {
	return bindataRead(
		__000007_workspaces_tableDownSql,
		"000007_workspaces_table.down.sql",
	)
}

func _000007_workspaces_tableDownSql() (*asset, error) {
	bytes, err := _000007_workspaces_tableDownSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000007_workspaces_table.down.sql", size: 34, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0xfc, 0xb1, 0x2b, 0x90, 0x8a, 0xcb, 0xe0, 0xd8, 0x87, 0x62, 0xcf, 0x86, 0x6b, 0xc9, 0x9c, 0x86, 0x21, 0xa4, 0x87, 0xad, 0x47, 0x49, 0xc5, 0x49, 0x34, 0xe2, 0x24, 0x49, 0x4e, 0x9a, 0x3d, 0x5a}}
	return a, nil
}

var __000007_workspaces_tableUpSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x5c\xcc\xc1\x6a\x83\x30\x18\x00\xe0\x73\xf2\x14\xff\xd1\x40\x18\x8e\xc1\x2e\x3b\x45\xc9\xb6\x6c\x2e\x8e\x98\x8d\x7a\x12\xdb\x44\x09\x52\x0d\x26\xd2\x16\xf1\xdd\x0b\x3d\xf4\xd0\xf3\x07\x5f\xae\x38\xd3\x1c\x34\xcb\x0a\x0e\xe2\x1d\x64\xa9\x81\xef\x44\xa5\x2b\x58\xd7\x27\x3f\xdb\xce\x9d\xb7\xed\x34\xcd\x43\xf0\xed\xc1\x06\x48\x30\x72\x06\xfe\x99\xca\x3f\x99\x4a\x5e\x5e\x09\xc5\x28\xb8\x7e\x5c\x7c\x13\xa7\xc1\x8e\x77\x7a\x4e\x53\x72\xeb\xe4\x5f\x51\x50\x0c\x00\x10\x6c\x8c\x6e\xec\x03\x7c\x55\xa5\xa4\x18\x1d\x27\xe3\x3a\x67\x4d\xb3\xbf\x3c\x8c\x8b\x37\x6d\xb4\x4d\x1b\x21\x13\x1f\x42\x6a\x8a\xd1\xaf\x12\x3f\x4c\xd5\xf0\xcd\x6b\x48\x9c\x21\x98\xbc\xe1\x6b\x00\x00\x00\xff\xff\x91\x17\x62\x4f\xbe\x00\x00\x00")

func _000007_workspaces_tableUpSqlBytes() ([]byte, error) {
	return bindataRead(
		__000007_workspaces_tableUpSql,
		"000007_workspaces_table.up.sql",
	)
}

func _000007_workspaces_tableUpSql() (*asset, error) {
	bytes, err := _000007_workspaces_tableUpSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000007_workspaces_table.up.sql", size: 190, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x6d, 0x77, 0x14, 0x67, 0xd1, 0x26, 0x83, 0x1, 0x5c, 0x13, 0xfb, 0xeb, 0x66, 0x48, 0xd2, 0xe6, 0x7b, 0xf0, 0x4, 0x92, 0x83, 0x3c, 0xee, 0x90, 0x7b, 0xb6, 0xf1, 0x78, 0x10, 0x1, 0xc7, 0xba}}
	return a, nil
}

var __000008_teamsDownSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\xf4\x09\x71\x0d\x52\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x4d\xca\xc9\x4f\xce\x2e\xe6\x72\x09\xf2\x0f\x50\x70\xf6\xf7\x09\xf5\xf5\x53\x28\xcf\x2f\xca\x2e\x2e\x48\x4c\x4e\x8d\xcf\x4c\xb1\xe6\xe2\xc2\xa1\xb1\x38\x23\xb1\x28\x33\x2f\x9d\x1c\x9d\xa9\xc5\xc5\x99\xf9\x79\xa8\x96\x26\x96\x96\x64\xc4\x17\xa7\x16\x95\x65\x26\xa7\x5a\x73\x01\x02\x00\x00\xff\xff\x24\x48\xc4\xb6\xad\x00\x00\x00")

func _000008_teamsDownSqlBytes() ([]byte, error) {
	return bindataRead(
		__000008_teamsDownSql,
		"000008_teams.down.sql",
	)
}

func _000008_teamsDownSql() (*asset, error) {
	bytes, err := _000008_teamsDownSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000008_teams.down.sql", size: 173, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0x71, 0xde, 0xad, 0x3b, 0xef, 0xf1, 0xd1, 0x17, 0x44, 0xee, 0x1d, 0x30, 0x33, 0x15, 0xa9, 0x84, 0x99, 0xe7, 0x6e, 0xbf, 0x8c, 0xa4, 0x4, 0xd6, 0x68, 0xab, 0x77, 0x68, 0x13, 0x74, 0x1, 0x5d}}
	return a, nil
}

var __000008_teamsUpSql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\xf4\x09\x71\x0d\x52\x08\x71\x74\xf2\x71\x55\xa8\xae\xd6\x2b\x28\x4a\x4d\xcb\xac\xa8\xad\x4d\xca\xc9\x4f\xce\x2e\xe6\x72\x74\x71\x51\x70\xf6\xf7\x09\xf5\xf5\x53\x28\xcf\x2f\xca\x2e\x2e\x48\x4c\x4e\x8d\xcf\x4c\x51\x08\x73\x0c\x72\xf6\x70\x0c\xd2\x30\x36\xd3\xb4\xe6\xe2\xc2\x61\x46\x71\x46\x62\x51\x66\x5e\x3a\x85\x86\xa4\x16\x17\x67\xe6\xe7\xa1\x38\x25\xb1\xb4\x24\x23\xbe\x38\xb5\xa8\x2c\x33\x39\x15\x6e\x8a\x91\x01\xc8\x94\xd0\x00\x17\xc7\x10\x2c\x3e\x51\x08\x76\x0d\x41\xb5\xdd\x56\x41\xdd\x40\x5d\x21\xdc\xc3\x35\xc8\x15\x43\x42\x5d\xc1\x3f\x08\x55\xd0\x33\x58\xc1\x2f\xd4\xc7\xc7\x9a\x0b\x10\x00\x00\xff\xff\xab\x8d\x48\xa9\x30\x01\x00\x00")

func _000008_teamsUpSqlBytes() ([]byte, error) {
	return bindataRead(
		__000008_teamsUpSql,
		"000008_teams.up.sql",
	)
}

func _000008_teamsUpSql() (*asset, error) {
	bytes, err := _000008_teamsUpSqlBytes()
	if err != nil {
		return nil, err
	}

	info := bindataFileInfo{name: "000008_teams.up.sql", size: 304, mode: os.FileMode(0644), modTime: time.Unix(1618643384, 0)}
	a := &asset{bytes: bytes, info: info, digest: [32]uint8{0xad, 0x91, 0xe6, 0xdf, 0x66, 0x76, 0x63, 0x68, 0x70, 0x8c, 0x30, 0x66, 0xf0, 0xc3, 0xa8, 0x76, 0xff, 0xe3, 0x59, 0x99, 0x49, 0xd, 0x90, 0xf5, 0xf4, 0x10, 0xeb, 0x6e, 0x0, 0x2c, 0x67, 0xeb}}
	return a, nil
}

// Asset loads and returns the asset for the given name.
// It returns an error if the asset could not be found or
// could not be loaded.
func Asset(name string) ([]byte, error) {
	canonicalName := strings.Replace(name, "\\", "/", -1)
	if f, ok := _bindata[canonicalName]; ok {
		a, err := f()
		if err != nil {
			return nil, fmt.Errorf("Asset %s can't read by error: %v", name, err)
		}
		return a.bytes, nil
	}
	return nil, fmt.Errorf("Asset %s not found", name)
}

// AssetString returns the asset contents as a string (instead of a []byte).
func AssetString(name string) (string, error) {
	data, err := Asset(name)
	return string(data), err
}

// MustAsset is like Asset but panics when Asset would return an error.
// It simplifies safe initialization of global variables.
func MustAsset(name string) []byte {
	a, err := Asset(name)
	if err != nil {
		panic("asset: Asset(" + name + "): " + err.Error())
	}

	return a
}

// MustAssetString is like AssetString but panics when Asset would return an
// error. It simplifies safe initialization of global variables.
func MustAssetString(name string) string {
	return string(MustAsset(name))
}

// AssetInfo loads and returns the asset info for the given name.
// It returns an error if the asset could not be found or
// could not be loaded.
func AssetInfo(name string) (os.FileInfo, error) {
	canonicalName := strings.Replace(name, "\\", "/", -1)
	if f, ok := _bindata[canonicalName]; ok {
		a, err := f()
		if err != nil {
			return nil, fmt.Errorf("AssetInfo %s can't read by error: %v", name, err)
		}
		return a.info, nil
	}
	return nil, fmt.Errorf("AssetInfo %s not found", name)
}

// AssetDigest returns the digest of the file with the given name. It returns an
// error if the asset could not be found or the digest could not be loaded.
func AssetDigest(name string) ([sha256.Size]byte, error) {
	canonicalName := strings.Replace(name, "\\", "/", -1)
	if f, ok := _bindata[canonicalName]; ok {
		a, err := f()
		if err != nil {
			return [sha256.Size]byte{}, fmt.Errorf("AssetDigest %s can't read by error: %v", name, err)
		}
		return a.digest, nil
	}
	return [sha256.Size]byte{}, fmt.Errorf("AssetDigest %s not found", name)
}

// Digests returns a map of all known files and their checksums.
func Digests() (map[string][sha256.Size]byte, error) {
	mp := make(map[string][sha256.Size]byte, len(_bindata))
	for name := range _bindata {
		a, err := _bindata[name]()
		if err != nil {
			return nil, err
		}
		mp[name] = a.digest
	}
	return mp, nil
}

// AssetNames returns the names of the assets.
func AssetNames() []string {
	names := make([]string, 0, len(_bindata))
	for name := range _bindata {
		names = append(names, name)
	}
	return names
}

// _bindata is a table, holding each asset generator, mapped to its name.
var _bindata = map[string]func() (*asset, error){
	"000001_init.down.sql":                  _000001_initDownSql,
	"000001_init.up.sql":                    _000001_initUpSql,
	"000002_system_settings_table.down.sql": _000002_system_settings_tableDownSql,
	"000002_system_settings_table.up.sql":   _000002_system_settings_tableUpSql,
	"000003_blocks_rootid.down.sql":         _000003_blocks_rootidDownSql,
	"000003_blocks_rootid.up.sql":           _000003_blocks_rootidUpSql,
	"000004_auth_table.down.sql":            _000004_auth_tableDownSql,
	"000004_auth_table.up.sql":              _000004_auth_tableUpSql,
	"000005_blocks_modifiedby.down.sql":     _000005_blocks_modifiedbyDownSql,
	"000005_blocks_modifiedby.up.sql":       _000005_blocks_modifiedbyUpSql,
	"000006_sharing_table.down.sql":         _000006_sharing_tableDownSql,
	"000006_sharing_table.up.sql":           _000006_sharing_tableUpSql,
	"000007_workspaces_table.down.sql":      _000007_workspaces_tableDownSql,
	"000007_workspaces_table.up.sql":        _000007_workspaces_tableUpSql,
	"000008_teams.down.sql":                 _000008_teamsDownSql,
	"000008_teams.up.sql":                   _000008_teamsUpSql,
}

// AssetDebug is true if the assets were built with the debug flag enabled.
const AssetDebug = false

// AssetDir returns the file names below a certain
// directory embedded in the file by go-bindata.
// For example if you run go-bindata on data/... and data contains the
// following hierarchy:
//     data/
//       foo.txt
//       img/
//         a.png
//         b.png
// then AssetDir("data") would return []string{"foo.txt", "img"},
// AssetDir("data/img") would return []string{"a.png", "b.png"},
// AssetDir("foo.txt") and AssetDir("notexist") would return an error, and
// AssetDir("") will return []string{"data"}.
func AssetDir(name string) ([]string, error) {
	node := _bintree
	if len(name) != 0 {
		canonicalName := strings.Replace(name, "\\", "/", -1)
		pathList := strings.Split(canonicalName, "/")
		for _, p := range pathList {
			node = node.Children[p]
			if node == nil {
				return nil, fmt.Errorf("Asset %s not found", name)
			}
		}
	}
	if node.Func != nil {
		return nil, fmt.Errorf("Asset %s not found", name)
	}
	rv := make([]string, 0, len(node.Children))
	for childName := range node.Children {
		rv = append(rv, childName)
	}
	return rv, nil
}

type bintree struct {
	Func     func() (*asset, error)
	Children map[string]*bintree
}

var _bintree = &bintree{nil, map[string]*bintree{
	"000001_init.down.sql": {_000001_initDownSql, map[string]*bintree{}},
	"000001_init.up.sql": {_000001_initUpSql, map[string]*bintree{}},
	"000002_system_settings_table.down.sql": {_000002_system_settings_tableDownSql, map[string]*bintree{}},
	"000002_system_settings_table.up.sql": {_000002_system_settings_tableUpSql, map[string]*bintree{}},
	"000003_blocks_rootid.down.sql": {_000003_blocks_rootidDownSql, map[string]*bintree{}},
	"000003_blocks_rootid.up.sql": {_000003_blocks_rootidUpSql, map[string]*bintree{}},
	"000004_auth_table.down.sql": {_000004_auth_tableDownSql, map[string]*bintree{}},
	"000004_auth_table.up.sql": {_000004_auth_tableUpSql, map[string]*bintree{}},
	"000005_blocks_modifiedby.down.sql": {_000005_blocks_modifiedbyDownSql, map[string]*bintree{}},
	"000005_blocks_modifiedby.up.sql": {_000005_blocks_modifiedbyUpSql, map[string]*bintree{}},
	"000006_sharing_table.down.sql": {_000006_sharing_tableDownSql, map[string]*bintree{}},
	"000006_sharing_table.up.sql": {_000006_sharing_tableUpSql, map[string]*bintree{}},
	"000007_workspaces_table.down.sql": {_000007_workspaces_tableDownSql, map[string]*bintree{}},
	"000007_workspaces_table.up.sql": {_000007_workspaces_tableUpSql, map[string]*bintree{}},
	"000008_teams.down.sql": {_000008_teamsDownSql, map[string]*bintree{}},
	"000008_teams.up.sql": {_000008_teamsUpSql, map[string]*bintree{}},
}}

// RestoreAsset restores an asset under the given directory.
func RestoreAsset(dir, name string) error {
	data, err := Asset(name)
	if err != nil {
		return err
	}
	info, err := AssetInfo(name)
	if err != nil {
		return err
	}
	err = os.MkdirAll(_filePath(dir, filepath.Dir(name)), os.FileMode(0755))
	if err != nil {
		return err
	}
	err = ioutil.WriteFile(_filePath(dir, name), data, info.Mode())
	if err != nil {
		return err
	}
	return os.Chtimes(_filePath(dir, name), info.ModTime(), info.ModTime())
}

// RestoreAssets restores an asset under the given directory recursively.
func RestoreAssets(dir, name string) error {
	children, err := AssetDir(name)
	// File
	if err != nil {
		return RestoreAsset(dir, name)
	}
	// Dir
	for _, child := range children {
		err = RestoreAssets(dir, filepath.Join(name, child))
		if err != nil {
			return err
		}
	}
	return nil
}

func _filePath(dir, name string) string {
	canonicalName := strings.Replace(name, "\\", "/", -1)
	return filepath.Join(append([]string{dir}, strings.Split(canonicalName, "/")...)...)
}
