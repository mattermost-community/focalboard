package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"

	"github.com/google/uuid"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/permissions/localpermissions"
	"github.com/webview/webview"

	"github.com/mattermost/mattermost/server/public/shared/mlog"
)

var sessionToken string = "su-" + uuid.New().String()

func getFreePort() (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", "localhost:0")
	if err != nil {
		return 0, err
	}

	l, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}

func runServer(port int) (*server.Server, error) {
	logger, _ := mlog.NewLogger()

	executable, _ := os.Executable()
	executableDir, _ := filepath.EvalSymlinks(filepath.Dir(executable))

	config := &config.Configuration{
		ServerRoot:              fmt.Sprintf("http://localhost:%d", port),
		Port:                    port,
		DBType:                  "sqlite3",
		DBConfigString:          path.Join(executableDir, "focalboard.db"),
		UseSSL:                  false,
		SecureCookie:            true,
		WebPath:                 path.Join(executableDir, "pack"),
		FilesDriver:             "local",
		FilesPath:               path.Join(executableDir, "focalboard_files"),
		Telemetry:               true,
		WebhookUpdate:           []string{},
		SessionExpireTime:       259200000000,
		SessionRefreshTime:      18000,
		LocalOnly:               false,
		EnableLocalMode:         false,
		LocalModeSocketLocation: "",
		AuthMode:                "native",
	}

	singleUser := len(sessionToken) > 0
	db, err := server.NewStore(config, singleUser, logger)
	if err != nil {
		fmt.Println("ERROR INITIALIZING THE SERVER STORE", err)
		return nil, err
	}

	permissionsService := localpermissions.New(db, logger)

	params := server.Params{
		Cfg:                config,
		SingleUserToken:    sessionToken,
		DBStore:            db,
		Logger:             logger,
		ServerID:           "",
		WSAdapter:          nil,
		NotifyBackends:     nil,
		PermissionsService: permissionsService,
	}

	server, err := server.New(params)
	if err != nil {
		fmt.Println("ERROR INITIALIZING THE SERVER", err)
		return nil, err
	}
	err = server.Start()
	if err != nil {
		return nil, err
	}
	return server, nil

}

func openBrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}
	if err != nil {
		log.Fatal(err)
	}
}

func main() {
	debug := true
	w := webview.New(debug)
	defer w.Destroy()
	port, err := getFreePort()
	if err != nil {
		log.Println("Failed to open a free port")
		log.Fatal(err)
	}
	server, err := runServer(port)
	if err != nil {
		log.Println("Failed to start the server")
		log.Fatal(err)
	}

	w.SetTitle("Focalboard")
	w.SetSize(1024, 768, webview.HintNone)

	script := fmt.Sprintf("localStorage.setItem('focalboardSessionId', '%s');", sessionToken)
	w.Init(script)

	w.Navigate(fmt.Sprintf("http://localhost:%d", port))
	w.Bind("openInNewBrowser", openBrowser)
	w.Init(`
document.addEventListener('click', function (e) {
    let a = e.target.closest('a[target="_blank"]');
    if (a) {
	    openInNewBrowser(a.getAttribute('href'));
	}
});
`)
	w.Run()
	server.Shutdown()
}
