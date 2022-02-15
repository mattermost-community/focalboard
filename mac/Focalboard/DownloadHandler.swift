// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation
import WebKit

class DownloadHandler: NSObject, WKDownloadDelegate {
	func download(_ download: WKDownload, decideDestinationUsing response: URLResponse, suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
		DispatchQueue.main.async {
			// Let user select location of file
			let savePanel = NSSavePanel()
			savePanel.canCreateDirectories = true
			savePanel.nameFieldStringValue = suggestedFilename
			// BUGBUG: Specifying the allowedFileTypes causes Catalina to hang / error out
			//savePanel.allowedFileTypes = [".boardsarchive"]
			savePanel.begin { (result) in
				if result.rawValue == NSApplication.ModalResponse.OK.rawValue,
				   let fileUrl = savePanel.url {
					if (FileManager.default.fileExists(atPath: fileUrl.path)) {
						// HACKHACK: WKWebView doesn't appear to overwrite files, so delete exsiting files first
						do {
							try FileManager.default.removeItem(at: fileUrl)
						} catch {
							let alert = NSAlert()
							alert.messageText = "Unable to replace \(fileUrl.path)"
							alert.addButton(withTitle: "OK")
							alert.alertStyle = .warning
							alert.runModal()
						}
					}
					completionHandler(fileUrl)
				}
			}
		}
	}

	func downloadDidFinish(_ download: WKDownload) {
		NSLog("downloadDidFinish")
	}
}
