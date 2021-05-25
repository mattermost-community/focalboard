package plan

import (
	"fmt"
	"os"
	"path/filepath"

	git "github.com/go-git/go-git/v5"
)

// RepoID identifies a repository - either plugin or template.
type RepoID string

const (
	// SourceRepo is the id of the template repository (source).
	SourceRepo RepoID = "source"
	// TargetRepo is the id of the plugin repository (target).
	TargetRepo RepoID = "target"
)

// Setup contains information about both parties
// in the sync: the plugin repository being updated
// and the source of the update - the template repo.
type Setup struct {
	Source         RepoSetup
	Target         RepoSetup
	VerboseLogging bool
}

// Logf logs the provided message.
// If verbose output is not enabled, the message will not be printed.
func (c Setup) Logf(tpl string, args ...interface{}) {
	if c.VerboseLogging {
		fmt.Fprintf(os.Stderr, tpl+"\n", args...)
	}
}

// LogErrorf logs the provided error message.
func (c Setup) LogErrorf(tpl string, args ...interface{}) {
	fmt.Fprintf(os.Stderr, tpl+"\n", args...)
}

// GetRepo is a helper to get the required repo setup.
// If the target parameter is not one of "plugin" or "template",
// the function panics.
func (c Setup) GetRepo(r RepoID) RepoSetup {
	switch r {
	case TargetRepo:
		return c.Target
	case SourceRepo:
		return c.Source
	default:
		panic(fmt.Sprintf("cannot get repository setup %q", r))
	}
}

// PathInRepo returns the full path of a file in the specified repository.
func (c Setup) PathInRepo(repo RepoID, path string) string {
	r := c.GetRepo(repo)
	return filepath.Join(r.Path, path)
}

// RepoSetup contains relevant information
// about a single repository (either source or target).
type RepoSetup struct {
	Git  *git.Repository
	Path string
}

// GetRepoSetup returns the repository setup for the specified path.
func GetRepoSetup(path string) (RepoSetup, error) {
	repo, err := git.PlainOpen(path)
	if err != nil {
		return RepoSetup{}, fmt.Errorf("failed to access git repository at %q: %v", path, err)
	}
	return RepoSetup{
		Git:  repo,
		Path: path,
	}, nil
}
