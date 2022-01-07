// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation
import WebKit

class CustomWKWebView : WKWebView {
	override func performKeyEquivalent(with event: NSEvent) -> Bool {
		if (event.modifierFlags.contains(.command) && event.characters?.lowercased() != "z") ||
			event.modifierFlags.contains(.control) ||
			event.modifierFlags.contains(.option) {
			return super.performKeyEquivalent(with: event)
		}

		super.performKeyEquivalent(with: event)
		// Return true to prevent a "funk" error sound
		return true
	}
}
