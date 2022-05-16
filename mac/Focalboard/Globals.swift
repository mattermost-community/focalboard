// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation

class Globals {
	static let ProductVersion = 70000
	static let WhatsNewVersion = 01100

	static var currentWhatsNewVersion: Int {
		get { return UserDefaults.standard.integer(forKey: "whatsNewVersion") }
		set { UserDefaults.standard.setValue(newValue, forKey: "whatsNewVersion") }
	}
}
