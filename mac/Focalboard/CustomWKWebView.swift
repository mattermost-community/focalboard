//
//  CustomWKWebView.swift
//  Focalboard
//
//  Created by Chen-I Lim on 1/7/22.
//

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
