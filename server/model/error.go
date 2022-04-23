package model

import (
	"database/sql"
	"errors"
	"fmt"

	apierrors "github.com/mattermost/mattermost-plugin-api/errors"
)

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
