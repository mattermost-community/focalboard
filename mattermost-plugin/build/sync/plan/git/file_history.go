package git

import (
	"crypto/sha1" //nolint
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/pkg/errors"
)

// ErrNotFound signifies the file was not found.
var ErrNotFound = fmt.Errorf("not found")

// FileHistory will trace all the versions of a file in the git repository
// and return a list of sha1 hashes of that file.
func FileHistory(path string, repo *git.Repository) ([]string, error) {
	logOpts := git.LogOptions{
		FileName: &path,
		All:      true,
	}
	commits, err := repo.Log(&logOpts)
	if errors.Is(err, plumbing.ErrReferenceNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get commits for path %q: %v", path, err)
	}
	defer commits.Close()
	hashHistory := []string{}
	cerr := commits.ForEach(func(c *object.Commit) error {
		root, err := repo.TreeObject(c.TreeHash)
		if err != nil {
			return fmt.Errorf("failed to get commit tree: %v", err)
		}
		f, err := traverseTree(root, path)
		if err == object.ErrFileNotFound || err == object.ErrDirectoryNotFound {
			// Ignoring file not found errors.
			return nil
		} else if err != nil {
			return err
		}
		sum, err := getReaderHash(f)
		f.Close()
		if err != nil {
			return err
		}
		hashHistory = append(hashHistory, sum)
		return nil
	})
	if cerr != nil && cerr != io.EOF {
		return nil, cerr
	}
	if len(hashHistory) == 0 {
		return nil, ErrNotFound
	}
	return hashHistory, nil
}

func traverseTree(root *object.Tree, path string) (io.ReadCloser, error) {
	dirName, fileName := filepath.Split(path)
	var err error
	t := root
	if dirName != "" {
		t, err = root.Tree(filepath.Clean(dirName))
		if err == object.ErrDirectoryNotFound {
			return nil, err
		} else if err != nil {
			return nil, fmt.Errorf("failed to traverse tree to %q: %v", dirName, err)
		}
	}
	f, err := t.File(fileName)
	if err == object.ErrFileNotFound {
		return nil, err
	} else if err != nil {
		return nil, fmt.Errorf("failed to lookup file %q: %v", fileName, err)
	}
	reader, err := f.Reader()
	if err != nil {
		return nil, fmt.Errorf("failed to open %q: %v", path, err)
	}
	return reader, nil
}

func getReaderHash(r io.Reader) (string, error) {
	h := sha1.New() // nolint
	_, err := io.Copy(h, r)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

// GetFileHash calculates the sha1 hash sum of the file.
func GetFileHash(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	sum, err := getReaderHash(f)
	if err != nil {
		return "", err
	}
	return sum, nil
}
