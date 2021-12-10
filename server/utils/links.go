// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package utils

import "fmt"

// MakeCardLink creates fully qualified card links based on card id and parents.
func MakeCardLink(serverRoot string, workspace string, board string, card string) string {
	return fmt.Sprintf("%s/workspace/%s/%s/0/%s/", serverRoot, workspace, board, card)
}
