package model

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

	apierrors "github.com/mattermost/mattermost-plugin-api/errors"
)

// ErrBlocksFromDifferentBoards is an error type that can be returned
// when a set of blocks belong to different boards.
var ErrBlocksFromDifferentBoards = errors.New("blocks belong to different boards")

// ErrNotFound is an error type that can be returned by store APIs when a query unexpectedly fetches no records.
type ErrNotFound struct {
	resource string
}

// NewErrNotFound creates a new ErrNotFound instance.
func NewErrNotFound(resource string) *ErrNotFound {
	return &ErrNotFound{
		resource: resource,
	}
}

func (nf *ErrNotFound) Error() string {
	return fmt.Sprintf("{%s} not found", nf.resource)
}

// IsErrNotFound returns true if `err` is or wraps one of:
// - model.ErrNotFound
// - sql.ErrNoRows
// - mattermost-plugin-api/errors/ErrNotFound.
func IsErrNotFound(err error) bool {
	if err == nil {
		return false
	}

	// check if this is a sql.ErrNotFound
	if errors.Is(err, sql.ErrNoRows) {
		return true
	}

	// check if this is a model.ErrNotFound
	var nf *ErrNotFound
	if errors.As(err, &nf) {
		return true
	}

	// check if this is a plugin API error
	return errors.Is(err, apierrors.ErrNotFound)
}

// ErrNotAllFound is an error type that can be returned by store APIs
// when a query that should fetch a certain amount of records
// unexpectedly fetches less.
type ErrNotAllFound struct {
	resources []string
}

func NewErrNotAllFound(resources []string) *ErrNotAllFound {
	return &ErrNotAllFound{
		resources: resources,
	}
}

func (na *ErrNotAllFound) Error() string {
	return fmt.Sprintf("not all instances in {%s} found", strings.Join(na.resources, ", "))
}

// IsErrNotAllFound returns true if `err` is or wraps a ErrNotAllFound.
func IsErrNotAllFound(err error) bool {
	if err == nil {
		return false
	}

	var na *ErrNotAllFound
	return errors.As(err, &na)
}
