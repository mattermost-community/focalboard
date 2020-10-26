//
//  AutoSaveWindowController.swift
//  Tasks
//
//  Created by Chen-I Lim on 10/8/20.
//

import Cocoa

class AutoSaveWindowController: NSWindowController {

	override func windowDidLoad() {
		super.windowDidLoad()

		// Implement this method to handle any initialization after your window controller's window has been loaded from its nib file.
		self.windowFrameAutosaveName = NSWindow.FrameAutosaveName("AutoSaveWindow")
	}
}
