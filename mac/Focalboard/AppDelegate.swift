// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Cocoa

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
	static let serverStartedNotification = NSNotification.Name("serverStarted")

	private var serverProcess: Process?

	var isServerStarted: Bool {
		get { return serverProcess != nil }
	}

	var serverPort = 8088
	var sessionToken: String = ""

	func applicationDidFinishLaunching(_ aNotification: Notification) {
		copyResources()
		startServer()

		NotificationCenter.default.post(name: AppDelegate.serverStartedNotification, object: nil)
	}

	func applicationWillTerminate(_ aNotification: Notification) {
		stopServer()
	}

	@IBAction func openNewWindow(_ sender: Any?) {
		let mainStoryBoard = NSStoryboard(name: "Main", bundle: nil)
		let tabViewController = mainStoryBoard.instantiateController(withIdentifier: "ViewController") as? ViewController
		let windowController = mainStoryBoard.instantiateController(withIdentifier: "WindowController") as! NSWindowController
		windowController.showWindow(self)
		windowController.contentViewController = tabViewController
	}

	private func webFolder() -> URL {
		let url = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
		return url.appendingPathComponent("Focalboard").appendingPathComponent("server")
	}

	private func copyResources() {
		let destBaseUrl = webFolder()
		do {
			try FileManager.default.createDirectory(atPath: destBaseUrl.path, withIntermediateDirectories: true, attributes: nil)
		} catch {
			NSLog("copyResources createDirectory ERROR")
		}
		copyResource(destBaseUrl: destBaseUrl, resourceRelativePath: "pack")
		copyResource(destBaseUrl: destBaseUrl, resourceRelativePath: "config.json")

		NSLog("copyResources OK")
	}

	private func copyResource(destBaseUrl: URL, resourceRelativePath: String, fileExtension: String = "") {
		let srcUrl = Bundle.main.url(forResource: "resources/" + resourceRelativePath, withExtension: fileExtension)!
		let destUrl = destBaseUrl.appendingPathComponent(resourceRelativePath)

		let fileManager = FileManager.default
		if fileManager.fileExists(atPath: destUrl.path) {
			do {
				try fileManager.removeItem(at: destUrl)
			} catch {
				NSLog("copyResource removeItem ERROR")
			}
		}

		do {
			try fileManager.copyItem(at: srcUrl, to: destUrl)
		} catch {
			NSLog("copyResource copyItem ERROR")
			return
		}
	}

    private func generateSessionToken() -> String {
        let bytesCount = 16
        var randomNumber = ""
		var randomBytes = [UInt8](repeating: 0, count: bytesCount)

        let status = SecRandomCopyBytes(kSecRandomDefault, bytesCount, &randomBytes)
		if status != errSecSuccess {
			fatalError("SecRandomCopyBytes ERROR: \(status)")
		}
		randomNumber = randomBytes.map({String(format: "%02hhx", $0)}).joined(separator: "")

        return "su-" + randomNumber
    }

	private func startServer() {
		sessionToken = generateSessionToken()

		let cwdUrl = webFolder()
		let executablePath = Bundle.main.path(forResource: "resources/bin/focalboard-server", ofType: "")

		let pid = ProcessInfo.processInfo.processIdentifier
		NSLog("pid: \(pid)")
		let serverProcess = Process()
		serverProcess.currentDirectoryPath = cwdUrl.path
		serverProcess.arguments = ["-monitorpid", "\(pid)", "-port", "\(serverPort)", "-single-user"]
		serverProcess.environment = ["FOCALBOARD_SINGLE_USER_TOKEN": sessionToken]
		serverProcess.launchPath = executablePath
		serverProcess.launch()
		self.serverProcess = serverProcess

		NSLog("startServer OK")
		NSLog("cwd: \(cwdUrl)")
	}

	private func stopServer() {
		guard let serverProcess = self.serverProcess else { return }

		serverProcess.terminate()
		self.serverProcess = nil
		NSLog("stopServer OK")
	}
}
