package plan_test

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/mattermost/mattermost-plugin-starter-template/build/sync/plan"
)

func TestCopyDirectory(t *testing.T) {
	assert := assert.New(t)

	// Create a temporary directory to copy to.
	dir, err := ioutil.TempDir("", "test")
	assert.Nil(err)
	defer os.RemoveAll(dir)

	wd, err := os.Getwd()
	assert.Nil(err)

	srcDir := filepath.Join(wd, "testdata")
	err = plan.CopyDirectory(srcDir, dir)
	assert.Nil(err)

	compareDirectories(t, dir, srcDir)
}

func TestOverwriteFileAction(t *testing.T) {
	assert := assert.New(t)

	// Create a temporary directory to copy to.
	dir, err := ioutil.TempDir("", "test")
	assert.Nil(err)
	defer os.RemoveAll(dir)

	wd, err := os.Getwd()
	assert.Nil(err)

	setup := plan.Setup{
		Source: plan.RepoSetup{
			Git:  nil,
			Path: filepath.Join(wd, "testdata", "b"),
		},
		Target: plan.RepoSetup{
			Git:  nil,
			Path: dir,
		},
	}
	action := plan.OverwriteFileAction{}
	action.Params.Create = true
	err = action.Run("c", setup)
	assert.Nil(err)

	compareDirectories(t, dir, filepath.Join(wd, "testdata", "b"))
}

func TestOverwriteDirectoryAction(t *testing.T) {
	assert := assert.New(t)

	// Create a temporary directory to copy to.
	dir, err := ioutil.TempDir("", "test")
	assert.Nil(err)
	defer os.RemoveAll(dir)

	wd, err := os.Getwd()
	assert.Nil(err)

	setup := plan.Setup{
		Source: plan.RepoSetup{
			Git:  nil,
			Path: wd,
		},
		Target: plan.RepoSetup{
			Git:  nil,
			Path: dir,
		},
	}
	action := plan.OverwriteDirectoryAction{}
	action.Params.Create = true
	err = action.Run("testdata", setup)
	assert.Nil(err)

	destDir := filepath.Join(dir, "testdata")
	srcDir := filepath.Join(wd, "testdata")
	compareDirectories(t, destDir, srcDir)
}

func compareDirectories(t *testing.T, pathA, pathB string) {
	assert := assert.New(t)
	t.Helper()

	aContents, err := ioutil.ReadDir(pathA)
	assert.Nil(err)
	bContents, err := ioutil.ReadDir(pathB)
	assert.Nil(err)
	assert.Len(aContents, len(bContents))

	// Check the directory contents are equal.
	for i, aFInfo := range aContents {
		bFInfo := bContents[i]
		assert.Equal(aFInfo.Name(), bFInfo.Name())
		assert.Equal(aFInfo.Mode(), bFInfo.Mode())
		assert.Equal(aFInfo.IsDir(), bFInfo.IsDir())
		if !aFInfo.IsDir() {
			assert.Equal(aFInfo.Size(), bFInfo.Size())
		}
	}
}
