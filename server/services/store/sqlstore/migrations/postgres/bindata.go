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

var __000001_init_up_sql = []byte("\x1f\x8b\x08\x00\x00\x00\x00\x00\x00\xff\x64\x8f\xb1\x4e\xc3\x30\x10\x86\xe7\xf8\x29\x6e\x74\xa4\x6c\x48\x2c\x4c\x6e\xb9\x82\x85\xe3\x56\xce\x15\x5a\x96\xca\xc4\x87\xb0\x30\x25\x8a\xcd\xc0\xdb\xa3\x46\x22\x43\xba\xdd\xff\xe9\xbe\x3b\xfd\x6b\x87\x8a\x10\x48\xad\x0c\x82\xde\x80\xdd\x12\xe0\x41\x77\xd4\xc1\x5b\xfa\xee\x3f\x33\x48\x51\xc5\x00\xcf\xca\xad\x1f\x95\x93\x37\xb7\x75\x23\xaa\x78\xce\x3c\x96\x93\x2f\x40\xba\xc5\x8e\x54\xbb\xa3\xd7\xc9\xb5\x7b\x63\xe0\x1e\x37\x6a\x6f\x08\xec\xf6\x45\x5e\xd6\x07\x3f\xf2\xb9\x9c\xae\xce\xe4\xfe\x83\xbf\x3c\xac\xf4\x83\xb6\xd4\x88\xaa\xfc\x0e\x0c\x84\x87\x69\x8e\x25\xcd\xe1\x3d\x72\x0a\xf9\x3f\xf5\x23\xfb\xc2\x97\xef\xb3\xf9\x33\x84\x25\x0a\x9c\x78\x81\x76\x4e\xb7\xca\x1d\xe1\x09\x8f\x20\x63\x68\x60\xee\x51\x8b\xfa\x4e\xfc\x05\x00\x00\xff\xff\xf7\x74\x9c\xd5\x0c\x01\x00\x00")

func _000001_init_up_sql() ([]byte, error) {
	return bindata_read(
		__000001_init_up_sql,
		"000001_init.up.sql",
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
}}
