// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Cocoa

class AutoSaveWindowController: NSWindowController {

	override func windowDidLoad() {
		super.windowDidLoad()

		// Implement this method to handle any initialization after your window controller's window has been loaded from its nib file.
		self.windowFrameAutosaveName = NSWindow.FrameAutosaveName("AutoSaveWindow")
	}
}
