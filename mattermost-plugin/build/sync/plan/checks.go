package plan

import (
	"fmt"
	"os"
	"sort"

	"github.com/pkg/errors"

	"github.com/mattermost/mattermost-plugin-starter-template/build/sync/plan/git"
)

// CheckFail is a custom error type used to indicate a
// check that did not pass (but did not fail due to external
// causes.
// Use `IsCheckFail` to check if an error is a check failure.
type CheckFail string

func (e CheckFail) Error() string {
	return string(e)
}

// CheckFailf creates an error with the specified message string.
// The error will pass the IsCheckFail filter.
func CheckFailf(msg string, args ...interface{}) CheckFail {
	if len(args) > 0 {
		msg = fmt.Sprintf(msg, args...)
	}
	return CheckFail(msg)
}

// IsCheckFail determines if an error is a check fail error.
func IsCheckFail(err error) bool {
	if err == nil {
		return false
	}
	_, ok := err.(CheckFail)
	return ok
}

// RepoIsCleanChecker checks whether the git repository is clean.
type RepoIsCleanChecker struct {
	Params struct {
		Repo RepoID
	}
}

// Check implements the Checker interface.
// The path parameter is ignored because this checker checks the state of a repository.
func (r RepoIsCleanChecker) Check(_ string, ctx Setup) error {
	ctx.Logf("checking if repository %q is clean", r.Params.Repo)
	rc := ctx.GetRepo(r.Params.Repo)
	repo := rc.Git
	worktree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %v", err)
	}
	status, err := worktree.Status()
	if err != nil {
		return fmt.Errorf("failed to get worktree status: %v", err)
	}
	if !status.IsClean() {
		return CheckFailf("%q repository is not clean", r.Params.Repo)
	}
	return nil
}

// PathExistsChecker checks whether the fle or directory with the
// path exists. If it does not, an error is returned.
type PathExistsChecker struct {
	Params struct {
		Repo RepoID
	}
}

// Check implements the Checker interface.
func (r PathExistsChecker) Check(path string, ctx Setup) error {
	repo := r.Params.Repo
	if repo == "" {
		repo = TargetRepo
	}
	ctx.Logf("checking if path %q exists in repo %q", path, repo)
	absPath := ctx.PathInRepo(repo, path)
	_, err := os.Stat(absPath)
	if os.IsNotExist(err) {
		return CheckFailf("path %q does not exist", path)
	} else if err != nil {
		return fmt.Errorf("failed to stat path %q: %v", absPath, err)
	}
	return nil
}

// FileUnalteredChecker checks whether the file in Repo is
// an unaltered version of that same file in ReferenceRepo.
//
// Its purpose is to check that a file has not been changed after forking a repository.
// It could be an old unaltered version, so the git history of the file is traversed
// until a matching version is found.
//
// If the repositories in the parameters are not specified,
// reference will default to the source repository and repo - to the target.
type FileUnalteredChecker struct {
	Params struct {
		SourceRepo RepoID `json:"compared-to"`
		TargetRepo RepoID `json:"in"`
	}
}

// Check implements the Checker interface.
func (f FileUnalteredChecker) Check(path string, setup Setup) error {
	setup.Logf("checking if file %q has not been altered", path)
	repo := f.Params.TargetRepo
	if repo == "" {
		repo = TargetRepo
	}
	source := f.Params.SourceRepo
	if source == "" {
		source = SourceRepo
	}
	trgPath := setup.PathInRepo(repo, path)
	srcPath := setup.PathInRepo(source, path)

	fileHashes, err := git.FileHistory(path, setup.GetRepo(source).Git)
	if err != nil {
		return err
	}

	var srcDeleted bool
	srcInfo, err := os.Stat(srcPath)
	if err != nil {
		if os.IsNotExist(err) {
			srcDeleted = true
		} else {
			return fmt.Errorf("failed to get stat for %q: %v", trgPath, err)
		}
	} else if srcInfo.IsDir() {
		return fmt.Errorf("%q is a directory in source repository", path)
	}

	trgInfo, err := os.Stat(trgPath)
	if os.IsNotExist(err) {
		if srcDeleted {
			// File has been deleted in target and source repositories.
			// Consider it unaltered.
			return nil
		}
		// Check if the file was ever in git history.
		_, err := git.FileHistory(path, setup.GetRepo(repo).Git)
		if errors.Is(err, git.ErrNotFound) {
			// This is a new file being introduced to the target repo.
			// Consider it unaltered.
			return nil
		} else if err != nil {
			return err
		}
		return CheckFailf("file %q has been deleted", trgPath)
	}
	if err != nil {
		return fmt.Errorf("failed to get stat for %q: %v", trgPath, err)
	}
	if trgInfo.IsDir() {
		return fmt.Errorf("%q is a directory", trgPath)
	}

	currentHash, err := git.GetFileHash(trgPath)
	if err != nil {
		return err
	}

	sort.Strings(fileHashes)
	idx := sort.SearchStrings(fileHashes, currentHash)
	if idx < len(fileHashes) && fileHashes[idx] == currentHash {
		return nil
	}
	return CheckFailf("file %q has been altered", trgPath)
}
