package main

import (
	"encoding/base64"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"os"
	"os/exec"
	"runtime"

	"github.com/google/uuid"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/webview/webview"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var sessionToken string = "su-" + uuid.New().String()
var settingsDir, settingsFile string = getSettingsPaths()

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

	config := &config.Configuration{
		ServerRoot:              fmt.Sprintf("http://localhost:%d", port),
		Port:                    port,
		DBType:                  "sqlite3",
		DBConfigString:          "./focalboard.db",
		UseSSL:                  false,
		SecureCookie:            true,
		WebPath:                 "./pack",
		FilesDriver:             "local",
		FilesPath:               "./focalboard_files",
		Telemetry:               true,
		WebhookUpdate:           []string{},
		SessionExpireTime:       259200000000,
		SessionRefreshTime:      18000,
		LocalOnly:               false,
		EnableLocalMode:         false,
		LocalModeSocketLocation: "",
		AuthMode:                "native",
	}

	db, err := server.NewStore(config, logger)
	if err != nil {
		fmt.Println("ERROR INITIALIZING THE SERVER STORE", err)
		return nil, err
	}

	params := server.Params{
		Cfg:             config,
		SingleUserToken: sessionToken,
		DBStore:         db,
		Logger:          logger,
		ServerID:        "",
		WSAdapter:       nil,
		NotifyBackends:  nil,
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

func getSettingsPaths() (dir string, file string) {	
	dir = fmt.Sprintf("%s/focalboard", getSettingsRoot())
	file = fmt.Sprintf("%s/settings", dir)
	log.Printf("Using settings file %v", file)
	return
}

func getSettingsRoot() string {
	xdgConfigHome := os.Getenv("XDG_CONFIG_HOME")
	if len(xdgConfigHome) != 0 {
		return xdgConfigHome
	}

	log.Println("XDG_CONFIG_HOME is not set, falling back to $HOME/.config")
	
	home := os.Getenv("HOME")
	if len(home) != 0 {
		return fmt.Sprintf("%s/.config", home)
	}
	
	log.Fatal("HOME is not set, cannot store settings")
	return ""
}

func loadSettings() string {
	bytes, err := ioutil.ReadFile(settingsFile)
	if err != nil {
		log.Printf("Could not load user settings: %v", err)
		return ""
	}
	return string(bytes)
}

func saveSettings(blob string) (err error) {
	if _, statErr := os.Stat(settingsDir); os.IsNotExist(statErr) { 
		err = os.MkdirAll(settingsDir, 0700)
	}
	if err == nil {
		err = ioutil.WriteFile(settingsFile, []byte(blob), 0600)
	}
	return
}

func receiveMessage(msg map[string]interface{}) {
	msgType, ok := msg["type"].(string)
	if !ok {
		log.Printf("Received unexpected script message, no value for key 'type': %v ", msg)
		return
	}

	blob, ok := msg["settingsBlob"].(string)
	if !ok {
		log.Println("Received unexpected script message, no value for key 'settingsBlob': %v", msg)
		return
	}

	log.Printf("Received message %v", msgType)

	switch msgType {
	case "didImportUserSettings":
		log.Printf("Imported user settings keys %v", msg["keys"])
	case "didNotImportUserSettings":
		break
	case "didChangeUserSettings":
		err := saveSettings(blob)
		if err == nil {
			log.Printf("Persisted user settings after change for key %v", msg["key"])
		} else {
			log.Printf("Could not persist user settings: %v", err)
		}
	default:
		log.Printf("Received script message of unknown type %v", msgType)
	}

	data, err := base64.StdEncoding.DecodeString(blob)
	if err == nil {
		log.Printf("Current user settings: %v", string(data))
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

	sessionTokenScript := fmt.Sprintf("localStorage.setItem('focalboardSessionId', '%s');", sessionToken)
	w.Init(sessionTokenScript)

	w.Bind("receiveMessage", receiveMessage)

	userSettingsScript := fmt.Sprintf("const NativeApp = { settingsBlob: \"%s\", receiveMessage: receiveMessage };", loadSettings())
	w.Init(userSettingsScript)

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
