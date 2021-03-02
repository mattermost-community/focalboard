// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Windows;
using Windows.Storage;

namespace Focalboard {
    class Webview2Installer {
        public int exitCode = -1;
        public int downloadProgress = 0;

        public delegate void InstallerHandler(Webview2Installer sender, EventArgs e);
        public event InstallerHandler InstallProgress;
        public event InstallerHandler InstallCompleted;

        private string filePath;

        public Webview2Installer() {
            var filename = $"{Guid.NewGuid().ToString()} MicrosoftEdgeWebview2Setup.exe";
            filePath = Path.Combine(System.IO.Path.GetTempPath(), filename);
            Debug.WriteLine($"Webview2Installer.filePath: {filePath}");
        }

        public void DownloadAndInstall() {
            const string url = "https://go.microsoft.com/fwlink/p/?LinkId=2124703";
            var uri = new Uri(url);

            try {
                if (File.Exists(filePath)) {
                    File.Delete(filePath);
                }

                WebClient wc = new WebClient();
                wc.DownloadFileAsync(uri, filePath);
                wc.DownloadProgressChanged += new DownloadProgressChangedEventHandler(wc_DownloadProgressChanged);
                wc.DownloadFileCompleted += new AsyncCompletedEventHandler(wc_DownloadFileCompleted);
            } catch (Exception ex) {
                MessageBox.Show($"Webview2 download ERROR: {ex.Message}", "Download error");
            }
        }

        private void wc_DownloadProgressChanged(object sender, DownloadProgressChangedEventArgs e) {
            downloadProgress = e.ProgressPercentage;
            InstallProgress?.Invoke(this, e);
        }

        private void wc_DownloadFileCompleted(object sender, AsyncCompletedEventArgs e) {
            if (e.Error == null) {
                var proc = Process.Start(filePath);
                proc.EnableRaisingEvents = true;
                proc.Exited += Proc_Exited;
            } else {
                MessageBox.Show($"Unable to download webview2 installer, please check your Internet connection. ERROR: {e.Error.Message}", "Download failed");
            }
        }

        private void Proc_Exited(object sender, EventArgs e) {
            // Delete downloaded installer
            try {
                if (File.Exists(filePath)) {
                    File.Delete(filePath);
                }
            } catch (Exception ex) {
                Debug.WriteLine($"Delete file failed. Error: {ex.Message}, filePath: {filePath}");
            }

            var proc = (Process)sender;
            exitCode = proc.ExitCode;
            InstallCompleted?.Invoke(this, e);
        }
    }
}
