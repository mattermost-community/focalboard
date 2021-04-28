// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Cocoa

class WhatsNewViewController:
	NSViewController {
	@IBOutlet var textView: NSTextView!
	@IBOutlet var rateButton: NSButton!

	override func viewDidLoad() {
		super.viewDidLoad()
	}

	@IBAction func rateButtonClicked(_ sender: Any) {
		let url = URL(string: "macappstore://itunes.apple.com/app/id1556908618?action=write-review")!
		NSWorkspace.shared.open(url)
		view.window?.close()
	}

	@IBAction func closeButtonClicked(_ sender: Any) {
		view.window?.close()
	}
}
