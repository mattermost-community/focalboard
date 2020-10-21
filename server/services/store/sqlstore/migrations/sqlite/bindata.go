package sqlite

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
	"strings"
)

func bindata_read(data []byte, name string) ([]byte, error) {
	gz, err := gzip.NewReader(bytes.NewBuffer(data))
	if err != nil {
		return nil, fmt.Errorf("Read %q: %v", name, err)
	}

	var buf bytes.Buffer
	_, err = io.Copy(&buf, gz)
	gz.Close()

	if err != nil {
		return nil, fmt.Errorf("Read %q: %v", name, err)
	}

	return buf.Bytes(), nil
}

var __000001_init_down_sql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x09\xf2\x0f\x50\x08\x71\x74\xf2\x71\x55\x48\xca\xc9\x4f\xce\x2e\xb6\xe6\x02\x04\x00\x00\xff\xff\x45\xbe\x01\x0f\x13\x00\x00\x00")

func _000001_init_down_sql() ([]byte, error) {
	return bindata_read(
		__000001_init_down_sql,
		"000001_init.down.sql",
	)
}

var __000001_init_up_sql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x64\x8f\xbf\x6e\x83\x30\x10\x87\x67\xfc\x14\xb7\x58\x18\x89\x4c\x95\x3a\xa4\x93\x93\x1c\x8d\x55\x20\x95\xb9\xb4\x61\x8a\x28\xbe\xa8\x56\x49\x8a\xc0\x1d\xfa\xf6\x15\x91\xca\x90\x6c\xf7\xfb\x4e\xdf\xfd\x59\x5b\xd4\x84\x40\x7a\x95\x23\x98\x0c\xca\x1d\x01\x1e\x4c\x45\x15\x7c\x74\xdf\xed\xd7\x08\x4a\x44\xde\xc1\x9b\xb6\xeb\xad\xb6\xea\xe1\x31\x49\x45\xe4\x2f\x23\x0f\xe1\xd8\x04\xd8\x68\x42\x32\x05\x5e\xc5\x72\x9f\xe7\xb0\xc1\x4c\xef\x73\x52\x15\xd9\x6c\xea\xa8\x58\xd6\x0b\x79\x5e\x48\x07\x72\xbb\x94\xc5\x52\x9e\xe2\x14\xe2\x72\xf7\x1e\x27\xd3\xac\xbe\x19\xf8\x12\x8e\x77\x3b\xc6\xf6\x93\xcf\x0d\xac\xcc\xb3\x29\x29\x15\x51\xf8\xed\x19\x08\x0f\xd7\xda\x87\x6e\x0e\x27\xcf\x9d\x1b\xff\x53\x3b\x70\x13\x78\x3a\x6d\x36\x7f\x7a\x77\x8b\x1c\x77\x7c\x83\x5e\xad\x29\xb4\xad\xe1\x05\x6b\x50\xde\xa5\x30\x3f\x99\x88\xe4\x49\xfc\x05\x00\x00\xff\xff\xa2\x33\x30\x8e\x29\x01\x00\x00")

func _000001_init_up_sql() ([]byte, error) {
	return bindata_read(
		__000001_init_up_sql,
		"000001_init.up.sql",
	)
}

var __000002_system_settings_table_down_sql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x09\xf2\x0f\x50\x08\x71\x74\xf2\x71\x55\x28\xae\x2c\x2e\x49\xcd\x8d\x2f\x4e\x2d\x29\xc9\xcc\x4b\x2f\xb6\xe6\x02\x04\x00\x00\xff\xff\x8b\x60\xbf\x1e\x1c\x00\x00\x00")

func _000002_system_settings_table_down_sql() ([]byte, error) {
	return bindata_read(
		__000002_system_settings_table_down_sql,
		"000002_system_settings_table.down.sql",
	)
}

var __000002_system_settings_table_up_sql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x0e\x72\x75\x0c\x71\x55\x08\x71\x74\xf2\x71\x55\xf0\x74\x53\xf0\xf3\x0f\x51\x70\x8d\xf0\x0c\x0e\x09\x56\x28\xae\x2c\x2e\x49\xcd\x8d\x2f\x4e\x2d\x29\xc9\xcc\x4b\x2f\xd6\xe0\xe2\xcc\x4c\x51\x08\x73\x0c\x72\xf6\x70\x0c\xd2\x30\x34\x30\xd0\xd4\xe1\xe2\x2c\x4b\xcc\x29\x4d\x55\x08\x71\x8d\x08\xd1\xe1\xe2\x0c\x08\xf2\xf4\x75\x0c\x8a\x54\xf0\x76\x8d\x54\xd0\xc8\x4c\xd1\xe4\xd2\xb4\xe6\x02\x04\x00\x00\xff\xff\x1e\xfb\x02\xf2\x60\x00\x00\x00")

func _000002_system_settings_table_up_sql() ([]byte, error) {
	return bindata_read(
		__000002_system_settings_table_up_sql,
		"000002_system_settings_table.up.sql",
	)
}

// Asset loads and returns the asset for the given name.
// It returns an error if the asset could not be found or
// could not be loaded.
func Asset(name string) ([]byte, error) {
	cannonicalName := strings.Replace(name, "\\", "/", -1)
	if f, ok := _bindata[cannonicalName]; ok {
		return f()
	}
	return nil, fmt.Errorf("Asset %s not found", name)
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
var _bindata = map[string]func() ([]byte, error){
	"000001_init.down.sql": _000001_init_down_sql,
	"000001_init.up.sql": _000001_init_up_sql,
	"000002_system_settings_table.down.sql": _000002_system_settings_table_down_sql,
	"000002_system_settings_table.up.sql": _000002_system_settings_table_up_sql,
}
// AssetDir returns the file names below a certain
// directory embedded in the file by go-bindata.
// For example if you run go-bindata on data/... and data contains the
// following hierarchy:
//     data/
//       foo.txt
//       img/
//         a.png
//         b.png
// then AssetDir("data") would return []string{"foo.txt", "img"}
// AssetDir("data/img") would return []string{"a.png", "b.png"}
// AssetDir("foo.txt") and AssetDir("notexist") would return an error
// AssetDir("") will return []string{"data"}.
func AssetDir(name string) ([]string, error) {
	node := _bintree
	if len(name) != 0 {
		cannonicalName := strings.Replace(name, "\\", "/", -1)
		pathList := strings.Split(cannonicalName, "/")
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
	for name := range node.Children {
		rv = append(rv, name)
	}
	return rv, nil
}

type _bintree_t struct {
	Func func() ([]byte, error)
	Children map[string]*_bintree_t
}
var _bintree = &_bintree_t{nil, map[string]*_bintree_t{
	"000001_init.down.sql": &_bintree_t{_000001_init_down_sql, map[string]*_bintree_t{
	}},
	"000001_init.up.sql": &_bintree_t{_000001_init_up_sql, map[string]*_bintree_t{
	}},
	"000002_system_settings_table.down.sql": &_bintree_t{_000002_system_settings_table_down_sql, map[string]*_bintree_t{
	}},
	"000002_system_settings_table.up.sql": &_bintree_t{_000002_system_settings_table_up_sql, map[string]*_bintree_t{
	}},
}}
