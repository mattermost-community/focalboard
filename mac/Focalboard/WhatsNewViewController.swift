// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Cocoa

class WhatsNewViewController:
	NSViewController {
	@IBOutlet var textView: NSTextView!
	@IBOutlet var rateButton: NSButton!
	@IBOutlet var cloudButton: NSButton!

	override func viewDidLoad() {
		super.viewDidLoad()
		loadText()
	}

	private func loadText() {
		guard let fileUrl = Bundle.main.url(forResource: "whatsnew", withExtension: "txt") else { assertionFailure("whatsnew"); return }
		guard let text = try? String(contentsOf: fileUrl, encoding: .utf8) else { assertionFailure("whatsnew"); return }

		textView.string = text
		textView.textStorage?.font = NSFont.systemFont(ofSize: 13)
		textView.textStorage?.foregroundColor = NSColor.textColor
	}

	@IBAction func rateButtonClicked(_ sender: Any) {
		let url = URL(string: "macappstore://itunes.apple.com/app/id1556908618?action=write-review")!
		NSWorkspace.shared.open(url)
		view.window?.close()
	}

	@IBAction func cloudButtonClicked(_ sender: Any) {
		Globals.openGetCloudServerUrl()
	}

	@IBAction func closeButtonClicked(_ sender: Any) {
		view.window?.close()
	}
}
