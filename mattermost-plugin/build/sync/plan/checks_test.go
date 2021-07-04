package plan_test

import (
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"testing"
	"time"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/stretchr/testify/assert"

	"github.com/mattermost/mattermost-plugin-starter-template/build/sync/plan"
)

// Tests for the RepoIsClean checker.
func TestRepoIsCleanChecker(t *testing.T) {
	assert := assert.New(t)

	// Create a git repository in a temporary dir.
	dir, err := ioutil.TempDir("", "test")
	assert.Nil(err)
	defer os.RemoveAll(dir)
	repo, err := git.PlainInit(dir, false)
	assert.Nil(err)

	// Repo should be clean.
	checker := plan.RepoIsCleanChecker{}
	checker.Params.Repo = plan.TargetRepo

	ctx := plan.Setup{
		Target: plan.RepoSetup{
			Path: dir,
			Git:  repo,
		},
	}
	assert.Nil(checker.Check("", ctx))

	// Create a file in the repository.
	err = ioutil.WriteFile(path.Join(dir, "data.txt"), []byte("lorem ipsum"), 0600)
	assert.Nil(err)
	err = checker.Check("", ctx)
	assert.EqualError(err, "\"target\" repository is not clean")
	assert.True(plan.IsCheckFail(err))
}

func TestPathExistsChecker(t *testing.T) {
	assert := assert.New(t)

	// Set up a working directory.
	wd, err := ioutil.TempDir("", "repo")
	assert.Nil(err)
	defer os.RemoveAll(wd)
	err = os.Mkdir(filepath.Join(wd, "t"), 0755)
	assert.Nil(err)
	err = ioutil.WriteFile(filepath.Join(wd, "t", "test"), []byte("lorem ipsum"), 0644)
	assert.Nil(err)

	checker := plan.PathExistsChecker{}
	checker.Params.Repo = plan.SourceRepo

	ctx := plan.Setup{
		Source: plan.RepoSetup{
			Path: wd,
		},
	}

	// Check with existing directory.
	assert.Nil(checker.Check("t", ctx))

	// Check with existing file.
	assert.Nil(checker.Check("t/test", ctx))

	err = checker.Check("nosuchpath", ctx)
	assert.NotNil(err)
	assert.True(plan.IsCheckFail(err))
}

func tempGitRepo(assert *assert.Assertions) (string, *git.Repository, func()) {
	// Setup repository.
	wd, err := ioutil.TempDir("", "repo")
	assert.Nil(err)

	// Initialize a repository.
	repo, err := git.PlainInit(wd, false)
	assert.Nil(err)
	w, err := repo.Worktree()
	assert.Nil(err)
	// Create repository files.
	err = ioutil.WriteFile(filepath.Join(wd, "test"),
		[]byte("lorem ipsum"), 0644)
	assert.Nil(err)
	sig := &object.Signature{
		Name:  "test",
		Email: "test@example.com",
		When:  time.Now(),
	}
	_, err = w.Commit("initial commit", &git.CommitOptions{Author: sig})
	assert.Nil(err)
	pathA := "a.txt"
	err = ioutil.WriteFile(filepath.Join(wd, pathA),
		[]byte("lorem ipsum"), 0644)
	assert.Nil(err)
	_, err = w.Add(pathA)
	assert.Nil(err)
	_, err = w.Commit("add files", &git.CommitOptions{Author: sig})
	assert.Nil(err)

	return wd, repo, func() { os.RemoveAll(wd) }

}

func TestUnalteredCheckerSameFile(t *testing.T) {
	assert := assert.New(t)

	wd, repo, cleanup := tempGitRepo(assert)
	defer cleanup()

	ctx := plan.Setup{
		Source: plan.RepoSetup{
			Path: wd,
			Git:  repo,
		},
		Target: plan.RepoSetup{
			Path: wd,
		},
	}

	checker := plan.FileUnalteredChecker{}
	checker.Params.SourceRepo = plan.SourceRepo
	checker.Params.TargetRepo = plan.TargetRepo

	// Check with the same file - check should succeed
	hashPath := "a.txt"
	err := checker.Check(hashPath, ctx)
	assert.Nil(err)
}

func TestUnalteredCheckerDifferentContents(t *testing.T) {
	assert := assert.New(t)

	wd, repo, cleanup := tempGitRepo(assert)
	defer cleanup()

	ctx := plan.Setup{
		Source: plan.RepoSetup{
			Path: wd,
			Git:  repo,
		},
		Target: plan.RepoSetup{
			Path: wd,
		},
	}

	checker := plan.FileUnalteredChecker{}
	checker.Params.SourceRepo = plan.SourceRepo
	checker.Params.TargetRepo = plan.TargetRepo

	// Create a file with the same suffix path, but different contents.
	tmpDir, err := ioutil.TempDir("", "test")
	assert.Nil(err)
	defer os.RemoveAll(tmpDir)
	err = ioutil.WriteFile(filepath.Join(tmpDir, "a.txt"),
		[]byte("not lorem ipsum"), 0644)
	assert.Nil(err)

	// Set the plugin path to the temporary directory.
	ctx.Target.Path = tmpDir
	err = checker.Check("a.txt", ctx)
	assert.True(plan.IsCheckFail(err))
	assert.EqualError(err, fmt.Sprintf("file %q has been altered", filepath.Join(tmpDir, "a.txt")))

}

// TestUnalteredCheckerNonExistant tests running the unaltered file checker
// in the case where the target file does not exist. If the files has no history,
// the checker should pass.
func TestUnalteredCheckerNonExistant(t *testing.T) {
	assert := assert.New(t)
	hashPath := "a.txt"

	wd, repo, cleanup := tempGitRepo(assert)
	defer cleanup()

	// Temporary repo.
	tmpDir, err := ioutil.TempDir("", "test")
	assert.Nil(err)
	defer os.RemoveAll(tmpDir)

	trgRepo, err := git.PlainInit(tmpDir, false)
	assert.Nil(err)

	ctx := plan.Setup{
		Source: plan.RepoSetup{
			Path: wd,
			Git:  repo,
		},
		Target: plan.RepoSetup{
			Path: tmpDir,
			Git:  trgRepo,
		},
	}

	checker := plan.FileUnalteredChecker{}
	checker.Params.SourceRepo = plan.SourceRepo
	checker.Params.TargetRepo = plan.TargetRepo

	err = checker.Check(hashPath, ctx)
	assert.Nil(err)
}
