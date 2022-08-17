// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation
import Cocoa

class Globals {
	static let ProductVersion = 70000
	static let WhatsNewVersion = 70000

	static var currentWhatsNewVersion: Int {
		get { return UserDefaults.standard.integer(forKey: "whatsNewVersion") }
		set { UserDefaults.standard.setValue(newValue, forKey: "whatsNewVersion") }
	}

	static func openGetCloudServerUrl() {
		let url = URL(string: "https://mattermost.com/sign-up/?utm_source=focalboard&utm_campaign=focalboardapp")!
		NSWorkspace.shared.open(url)
	}
}
