package plan

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// ActionConditions adds condition support to actions.
type ActionConditions struct {
	// Conditions are checkers run before executing the
	// action. If any one fails (returns an error), the action
	// itself is not executed.
	Conditions []Check
}

// Check runs the conditions associated with the action and returns
// the first error (if any).
func (c ActionConditions) Check(path string, setup Setup) error {
	if len(c.Conditions) > 0 {
		setup.Logf("checking action conditions")
	}
	for _, condition := range c.Conditions {
		err := condition.Check(path, setup)
		if err != nil {
			return err
		}
	}
	return nil
}

// OverwriteFileAction is used to overwrite a file.
type OverwriteFileAction struct {
	ActionConditions
	Params struct {
		// Create determines whether the target directory
		// will be created if it does not exist.
		Create bool `json:"create"`
	}
}

// Run implements plan.Action.Run.
func (a OverwriteFileAction) Run(path string, setup Setup) error {
	setup.Logf("overwriting file %q", path)
	src := setup.PathInRepo(SourceRepo, path)
	dst := setup.PathInRepo(TargetRepo, path)

	dstInfo, err := os.Stat(dst)
	switch {
	case os.IsNotExist(err):
		if !a.Params.Create {
			return fmt.Errorf("path %q does not exist, not creating", dst)
		}
	case err != nil:
		return fmt.Errorf("failed to check path %q: %v", dst, err)
	case dstInfo.IsDir():
		return fmt.Errorf("path %q is a directory", dst)
	}

	srcInfo, err := os.Stat(src)
	if os.IsNotExist(err) {
		return fmt.Errorf("file %q does not exist", src)
	} else if err != nil {
		return fmt.Errorf("failed to check path %q: %v", src, err)
	}
	if srcInfo.IsDir() {
		return fmt.Errorf("path %q is a directory", src)
	}

	srcF, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open %q: %v", src, err)
	}
	defer srcF.Close()
	dstF, err := os.OpenFile(dst, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, srcInfo.Mode())
	if err != nil {
		return fmt.Errorf("failed to open %q: %v", src, err)
	}
	defer dstF.Close()
	_, err = io.Copy(dstF, srcF)
	if err != nil {
		return fmt.Errorf("failed to copy file %q: %v", path, err)
	}
	return nil
}

// OverwriteDirectoryAction is used to completely overwrite directories.
// If the target directory exists, it will be removed first.
type OverwriteDirectoryAction struct {
	ActionConditions
	Params struct {
		// Create determines whether the target directory
		// will be created if it does not exist.
		Create bool `json:"create"`
	}
}

// Run implements plan.Action.Run.
func (a OverwriteDirectoryAction) Run(path string, setup Setup) error {
	setup.Logf("overwriting directory %q", path)
	src := setup.PathInRepo(SourceRepo, path)
	dst := setup.PathInRepo(TargetRepo, path)

	dstInfo, err := os.Stat(dst)
	switch {
	case os.IsNotExist(err):
		if !a.Params.Create {
			return fmt.Errorf("path %q does not exist, not creating", dst)
		}
	case err != nil:
		return fmt.Errorf("failed to check path %q: %v", dst, err)
	default:
		if !dstInfo.IsDir() {
			return fmt.Errorf("path %q is not a directory", dst)
		}
		err = os.RemoveAll(dst)
		if err != nil {
			return fmt.Errorf("failed to remove directory %q: %v", dst, err)
		}
	}

	srcInfo, err := os.Stat(src)
	if os.IsNotExist(err) {
		return fmt.Errorf("directory %q does not exist", src)
	} else if err != nil {
		return fmt.Errorf("failed to check path %q: %v", src, err)
	}
	if !srcInfo.IsDir() {
		return fmt.Errorf("path %q is not a directory", src)
	}

	err = CopyDirectory(src, dst)
	if err != nil {
		return fmt.Errorf("failed to copy path %q: %v", path, err)
	}
	return nil
}

// CopyDirectory copies the directory src to dst so that after
// a successful operation the contents of src and dst are equal.
func CopyDirectory(src, dst string) error {
	copier := dirCopier{dst: dst, src: src}
	return filepath.Walk(src, copier.Copy)
}

type dirCopier struct {
	dst string
	src string
}

// Convert a path in the source directory to a path in the destination
// directory.
func (d dirCopier) srcToDst(path string) (string, error) {
	suff := strings.TrimPrefix(path, d.src)
	if suff == path {
		return "", fmt.Errorf("path %q is not in %q", path, d.src)
	}
	return filepath.Join(d.dst, suff), nil
}

// Copy is an implementation of filepatch.WalkFunc that copies the
// source directory to target with all subdirectories.
func (d dirCopier) Copy(srcPath string, info os.FileInfo, err error) error {
	if err != nil {
		return fmt.Errorf("failed to copy directory: %v", err)
	}
	trgPath, err := d.srcToDst(srcPath)
	if err != nil {
		return err
	}
	if info.IsDir() {
		err = os.MkdirAll(trgPath, info.Mode())
		if err != nil {
			return fmt.Errorf("failed to create directory %q: %v", trgPath, err)
		}
		err = os.Chtimes(trgPath, info.ModTime(), info.ModTime())
		if err != nil {
			return fmt.Errorf("failed to create directory %q: %v", trgPath, err)
		}
		return nil
	}
	err = copyFile(srcPath, trgPath, info)
	if err != nil {
		return fmt.Errorf("failed to copy file %q: %v", srcPath, err)
	}
	return nil
}

func copyFile(src, dst string, info os.FileInfo) error {
	srcF, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("failed to open source file %q: %v", src, err)
	}
	defer srcF.Close()
	dstF, err := os.OpenFile(dst, os.O_CREATE|os.O_WRONLY, info.Mode())
	if err != nil {
		return fmt.Errorf("failed to open destination file %q: %v", dst, err)
	}
	_, err = io.Copy(dstF, srcF)
	if err != nil {
		dstF.Close()
		return fmt.Errorf("failed to copy file %q: %v", src, err)
	}
	if err = dstF.Close(); err != nil {
		return fmt.Errorf("failed to close file %q: %v", dst, err)
	}
	err = os.Chtimes(dst, info.ModTime(), info.ModTime())
	if err != nil {
		return fmt.Errorf("failed to adjust file modification time for %q: %v", dst, err)
	}
	return nil
}
