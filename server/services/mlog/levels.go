// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package mlog

import "github.com/mattermost/logr/v2"

// Standard levels
var (
	Panic = logr.Panic // ID = 0
	Fatal = logr.Fatal // ID = 1
	Error = logr.Error // ID = 2
	Warn  = logr.Warn  // ID = 3
	Info  = logr.Info  // ID = 4
	Debug = logr.Debug // ID = 5
	Trace = logr.Trace // ID = 6
)

// Register custom (discrete) levels here.
// !!!!! Custom ID's must be between 20 and 32,768 !!!!!!
var (
/* Example
// used by the audit system
LvlAuditAPI     = Level{ID: 100, Name: "audit-api"}
LvlAuditContent = Level{ID: 101, Name: "audit-content"}
LvlAuditPerms   = Level{ID: 102, Name: "audit-permissions"}
LvlAuditCLI     = Level{ID: 103, Name: "audit-cli"}
*/

// add more here ...
)

// Combinations for LogM (log multi)
var (
/* Example
MLvlAuditAll = []LogLevel{LvlAuditAPI, LvlAuditContent, LvlAuditPerms, LvlAuditCLI}
*/
)
