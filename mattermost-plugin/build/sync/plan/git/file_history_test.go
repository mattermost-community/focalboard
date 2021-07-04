package git_test

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
	"time"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/stretchr/testify/assert"

	gitutil "github.com/mattermost/mattermost-plugin-starter-template/build/sync/plan/git"
)

var fileContents = []byte("abcdefg")

func TestFileHistory(t *testing.T) {
	assert := assert.New(t)

	dir, err := ioutil.TempDir("", "repo")
	assert.Nil(err)
	defer os.RemoveAll(dir)

	// Initialize a repository.
	repo, err := git.PlainInit(dir, false)
	assert.Nil(err)
	w, err := repo.Worktree()
	assert.Nil(err)
	// Create repository files.
	err = ioutil.WriteFile(filepath.Join(dir, "test"), fileContents, 0644)
	assert.Nil(err)
	_, err = w.Add("test")
	assert.Nil(err)
	sig := &object.Signature{
		Name:  "test",
		Email: "test@example.com",
		When:  time.Now(),
	}
	_, err = w.Commit("initial commit", &git.CommitOptions{Author: sig})
	assert.Nil(err)
	pathA := "a.txt"
	err = ioutil.WriteFile(filepath.Join(dir, pathA), fileContents, 0644)
	assert.Nil(err)
	pathB := "b.txt"
	err = ioutil.WriteFile(filepath.Join(dir, pathB), fileContents, 0644)
	assert.Nil(err)
	_, err = w.Add(pathA)
	assert.Nil(err)
	_, err = w.Add(pathB)
	assert.Nil(err)
	_, err = w.Commit("add files", &git.CommitOptions{Author: sig})
	assert.Nil(err)
	// Delete one of the files.
	_, err = w.Remove(pathB)
	assert.Nil(err)
	_, err = w.Commit("remove file b.txt", &git.CommitOptions{
		Author: sig,
		All:    true,
	})
	assert.Nil(err)

	repo, err = git.PlainOpen(dir)
	assert.Nil(err)

	// Call file history on an existing file.
	sums, err := gitutil.FileHistory("a.txt", repo)
	assert.Nil(err)
	assert.Equal([]string{"2fb5e13419fc89246865e7a324f476ec624e8740"}, sums)

	// Calling with a non-existent file returns error.
	sums, err = gitutil.FileHistory(filepath.Join(dir, "nosuch_testfile.txt"), repo)
	assert.Equal(gitutil.ErrNotFound, err)
	assert.Nil(sums)

	// Calling with a non-existent file that was in git history returns no error.
	_, err = gitutil.FileHistory(pathB, repo)
	assert.Nil(err)
}
