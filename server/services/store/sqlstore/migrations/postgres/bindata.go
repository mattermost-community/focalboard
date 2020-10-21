package postgres

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

var __000001_init_up_sql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x64\x8f\x31\x4f\xc3\x30\x10\x85\xe7\xf8\x57\xbc\x31\x91\xb2\x21\xb1\x30\xb9\xe5\x0a\x86\xc4\xa9\x9c\x2b\xb4\x2c\x55\x88\x0f\x61\x11\x4a\x14\x9b\x81\x7f\x8f\xda\x21\x43\xba\xdd\x7d\xba\xef\x9e\xde\xda\x91\x66\x02\xeb\x55\x45\x30\x1b\xd8\x86\x41\x7b\xd3\x72\x8b\xf7\xe1\xa7\xff\x8a\xc8\x55\x16\x3c\x5e\xb4\x5b\x3f\x6a\x97\xdf\xdc\x16\xa5\xca\xc2\x29\xca\x94\x8e\x5d\x02\x9b\x9a\x5a\xd6\xf5\x96\xdf\x2e\xae\xdd\x55\x15\xee\x69\xa3\x77\x15\xc3\x36\xaf\xf9\xf9\x7c\xec\x26\x39\xa5\xe3\xd5\x9b\xd8\x7f\xca\x77\x87\x95\x79\x30\x96\x4b\x95\xa5\xbf\x51\xc0\xb4\xbf\xcc\x21\x0d\xf3\xf2\x11\x64\xf0\x11\x4f\x6d\x63\x4b\x95\xf5\x93\x74\x49\xce\xe9\xb3\xf9\x3b\xfa\x25\xf2\x32\xc8\x02\x6d\x9d\xa9\xb5\x3b\xe0\x99\x0e\xc8\x83\x2f\x31\xf7\x28\x54\x71\xa7\xfe\x03\x00\x00\xff\xff\xa3\xc9\xa2\x70\x0c\x01\x00\x00")

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

var __000002_system_settings_table_up_sql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x72\x0e\x72\x75\x0c\x71\x55\x08\x71\x74\xf2\x71\x55\xf0\x74\x53\xf0\xf3\x0f\x51\x70\x8d\xf0\x0c\x0e\x09\x56\x28\xae\x2c\x2e\x49\xcd\x8d\x2f\x4e\x2d\x29\xc9\xcc\x4b\x2f\x56\xd0\xe0\xe2\xcc\x4c\x51\x08\x73\x0c\x72\xf6\x70\x0c\xd2\x30\x34\x30\xd0\xd4\xe1\xe2\x2c\x4b\xcc\x29\x4d\x55\x08\x71\x8d\x08\xd1\xe1\xe2\x0c\x08\xf2\xf4\x75\x0c\x8a\x54\xf0\x76\x8d\x54\xd0\xc8\x4c\xd1\xe4\xd2\xb4\xe6\x02\x04\x00\x00\xff\xff\x17\x95\xca\x5b\x61\x00\x00\x00")

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
