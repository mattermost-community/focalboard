// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Windows;
using Windows.Storage;

namespace Focalboard {
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application {
        public string sessionToken = "";
        public int port;

        private Mutex mutex;

        App() {
            SingleInstanceCheck();

            Startup += App_Startup;
        }

        public void SingleInstanceCheck() {
            bool isOnlyInstance = false;
            mutex = new Mutex(true, @"Focalboard", out isOnlyInstance);
            if (!isOnlyInstance) {
                ShowExistingWindow();
                Shutdown();
            }
        }

        [DllImport("User32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        // shows the window of the single-instance that is already open
        private void ShowExistingWindow() {
            var currentProcess = Process.GetCurrentProcess();
            var processes = Process.GetProcessesByName(currentProcess.ProcessName);
            foreach (var process in processes) {
                // the single-instance already open should have a MainWindowHandle
                if (process.MainWindowHandle != IntPtr.Zero) {
                    // restores the window in case it was minimized
                    const int SW_SHOWNORMAL = 1;
                    ShowWindow(process.MainWindowHandle, SW_SHOWNORMAL);

                    // brings the window to the foreground
                    SetForegroundWindow(process.MainWindowHandle);

                    return;
                }
            }
        }

        private void App_Startup(object sender, StartupEventArgs e) {
            Debug.WriteLine($"App_Startup()");

            try {
                InitServer();
            } catch (Exception ex) {
                MessageBox.Show($"InitServer ERROR: {ex.ToString()}", "Focalboard");
                Shutdown();
            }
        }

        private void InitServer() {
            port = FindFreePort();
            Debug.WriteLine("port: {0}", port);

            sessionToken = CreateSessionToken();

            // Need to set CWD so the server can read the config file
			var appFolder = Utils.GetAppFolder();
			Directory.SetCurrentDirectory(appFolder);

			string tempFolder;
            try {
                tempFolder = ApplicationData.Current.LocalFolder.Path;
            } catch {
                var documentsFolder = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
                tempFolder = documentsFolder;
                // Not a UWP app, store in Documents
            }
            var dbPath = Path.Combine(tempFolder, "focalboard.db");
            Debug.WriteLine($"dbPath: {dbPath}");

            var cwd = Directory.GetCurrentDirectory();
            var webFolder = Path.Combine(cwd, @"pack");
            webFolder = webFolder.Replace(@"\", @"/");
            dbPath = dbPath.Replace(@"\", @"/");
            byte[] webFolderBytes = Encoding.UTF8.GetBytes(webFolder);
            byte[] sessionTokenBytes = Encoding.UTF8.GetBytes(sessionToken);
            byte[] dbPathBytes = Encoding.UTF8.GetBytes(dbPath);
            GoFunctions.StartServer(webFolderBytes, port, sessionTokenBytes, dbPathBytes);

            Debug.WriteLine("Server started");
        }

        private string CreateSessionToken() {
            using (RandomNumberGenerator rng = new RNGCryptoServiceProvider()) {
                byte[] tokenData = new byte[32];
                rng.GetBytes(tokenData);

                string token = Convert.ToBase64String(tokenData);
                return token;
            }
        }

        private int FindFreePort() {
            int port = 0;
            Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            try {
                var localEP = new IPEndPoint(IPAddress.Any, 0);
                socket.Bind(localEP);
                localEP = (IPEndPoint)socket.LocalEndPoint;
                port = localEP.Port;
            } finally {
                socket.Close();
            }
            return port;
        }
    }

    static class GoFunctions {
        [DllImport(@"focalboard-server.dll", CharSet = CharSet.Unicode, CallingConvention = CallingConvention.StdCall)]
        public static extern void StartServer(byte[] webPath, int port, byte[] singleUserToken, byte[] dbConfigString);

        [DllImport(@"focalboard-server.dll", CharSet = CharSet.Unicode, CallingConvention = CallingConvention.StdCall)]
        public static extern void StopServer();
    }
}
