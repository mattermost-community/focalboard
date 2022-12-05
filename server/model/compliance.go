// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
package model

// ComplianceResponse is the generic response body to a compliance API
// swagger:model
type ComplianceResponse struct {
	// Is there a next page for pagination?
	// required: true
	HasNext bool `json:"hasNext"`

	// The array of results
	// required: true
	Results interface{} `json:"results"`
}
