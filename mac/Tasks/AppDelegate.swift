//
//  AppDelegate.swift
//  Tasks
//
//  Created by Chen-I Lim on 10/7/20.
//

import Cocoa

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
	static let serverStartedNotification = NSNotification.Name("serverStarted")

	private var serverProcess: Process?
	var serverPort = 8088

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
		return url.appendingPathComponent("server")
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

	private func startServer() {
		let cwdUrl = webFolder()
		let executablePath = Bundle.main.path(forResource: "resources/bin/octoserver", ofType: "")

		let pid = ProcessInfo.processInfo.processIdentifier
		NSLog("pid: \(pid)")
		let serverProcess = Process()
		serverProcess.currentDirectoryPath = cwdUrl.path
		serverProcess.arguments = ["-monitorpid", "\(pid)", "-port", "\(serverPort)"]
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
