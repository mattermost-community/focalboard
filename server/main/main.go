// Package classification Focalboard Server
//
// Server for Focalboard
//
//     Schemes: http, https
//     Host: localhost
//     BasePath: /api/v1
//     Version: 1.0.0
//     License: Custom https://github.com/mattermost/focalboard/blob/main/LICENSE.txt
//     Contact: Focalboard<api@focalboard.com> https://www.focalboard.com
//
//     Consumes:
//     - application/json
//
//     Produces:
//     - application/json
//
//     securityDefinitions:
//       BearerAuth:
//         type: apiKey
//         name: Authorization
//         in: header
//         description: 'Pass session token using Bearer authentication, e.g. set header "Authorization: Bearer <session token>"'
//
// swagger:meta
package main

import (
	"C"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
)
import (
	"github.com/mattermost/focalboard/server/services/mlog"
)

// Active server used with shared code (dll)
var pServer *server.Server

const (
	timeBetweenPidMonitoringChecks = 2 * time.Second
)

func isProcessRunning(pid int) bool {
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}

	err = process.Signal(syscall.Signal(0))

	return err == nil
}

// monitorPid is used to keep the server lifetime in sync with another (client app) process
func monitorPid(pid int, logger *mlog.Logger) {
	logger.Info("Monitoring PID", mlog.Int("pid", pid))

	go func() {
		for {
			if !isProcessRunning(pid) {
				logger.Info("Monitored process not found, exiting.")
				os.Exit(1)
			}

			time.Sleep(timeBetweenPidMonitoringChecks)
		}
	}()
}

func logInfo(logger *mlog.Logger) {
	logger.Info("FocalBoard Server",
		mlog.String("version", model.CurrentVersion),
		mlog.String("edition", model.Edition),
		mlog.String("build_number", model.BuildNumber),
		mlog.String("build_date", model.BuildDate),
		mlog.String("build_hash", model.BuildHash),
	)
}

func main() {
	// config.json file
	config, err := config.ReadConfigFile()
	if err != nil {
		log.Fatal("Unable to read the config file: ", err)
		return
	}

	logger := mlog.NewLogger()
	cfgJSON := config.LoggingCfgJSON
	if config.LoggingCfgFile == "" && cfgJSON == "" {
		// if no logging defined, use default config (console output)
		cfgJSON = defaultLoggingConfig()
	}
	err = logger.Configure(config.LoggingCfgFile, cfgJSON)
	if err != nil {
		log.Fatal("Error in config file for logger: ", err)
		return
	}
	defer func() { _ = logger.Shutdown() }()

	if logger.HasTargets() {
		restore := logger.RedirectStdLog(mlog.Info, mlog.String("src", "stdlog"))
		defer restore()
	}

	logInfo(logger)

	// Command line args
	pMonitorPid := flag.Int("monitorpid", -1, "a process ID")
	pPort := flag.Int("port", config.Port, "the port number")
	pSingleUser := flag.Bool("single-user", false, "single user mode")
	pDBType := flag.String("dbtype", "", "Database type")
	pDBConfig := flag.String("dbconfig", "", "Database config")
	flag.Parse()

	singleUser := false
	if pSingleUser != nil {
		singleUser = *pSingleUser
	}

	singleUserToken := ""
	if singleUser {
		singleUserToken = os.Getenv("FOCALBOARD_SINGLE_USER_TOKEN")
		if len(singleUserToken) < 1 {
			logger.Fatal("The FOCALBOARD_SINGLE_USER_TOKEN environment variable must be set for single user mode ")
			return
		}
		logger.Info("Single user mode")
	}

	if pMonitorPid != nil && *pMonitorPid > 0 {
		monitorPid(*pMonitorPid, logger)
	}

	// Override config from commandline

	if pDBType != nil && len(*pDBType) > 0 {
		config.DBType = *pDBType
		logger.Info("DBType from commandline", mlog.String("DBType", *pDBType))
	}

	if pDBConfig != nil && len(*pDBConfig) > 0 {
		config.DBConfigString = *pDBConfig
		// Don't echo, as the confix string may contain passwords
		logger.Info("DBConfigString overriden from commandline")
	}

	if pPort != nil && *pPort > 0 && *pPort != config.Port {
		// Override port
		logger.Info("Port from commandline", mlog.Int("port", *pPort))
		config.Port = *pPort
	}

	server, err := server.New(config, singleUserToken, logger)
	if err != nil {
		logger.Fatal("server.New ERROR", mlog.Err(err))
	}

	if err := server.Start(); err != nil {
		logger.Fatal("server.Start ERROR", mlog.Err(err))
	}

	// Setting up signal capturing
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)

	// Waiting for SIGINT (pkill -2)
	<-stop

	_ = server.Shutdown()
}

// StartServer starts the server
//export StartServer
func StartServer(webPath *C.char, filesPath *C.char, port int, singleUserToken, dbConfigString *C.char) {
	startServer(
		C.GoString(webPath),
		C.GoString(filesPath),
		port,
		C.GoString(singleUserToken),
		C.GoString(dbConfigString),
	)
}

// StopServer stops the server
//export StopServer
func StopServer() {
	stopServer()
}

func startServer(webPath string, filesPath string, port int, singleUserToken, dbConfigString string) {
	if pServer != nil {
		stopServer()
		pServer = nil
	}

	// config.json file
	config, err := config.ReadConfigFile()
	if err != nil {
		log.Fatal("Unable to read the config file: ", err)
		return
	}

	logger := mlog.NewLogger()
	err = logger.Configure(config.LoggingCfgFile, config.LoggingCfgJSON)
	if err != nil {
		log.Fatal("Error in config file for logger: ", err)
		return
	}

	logInfo(logger)

	if len(filesPath) > 0 {
		config.FilesPath = filesPath
	}

	if len(webPath) > 0 {
		config.WebPath = webPath
	}

	if port > 0 {
		config.Port = port
	}

	if len(dbConfigString) > 0 {
		config.DBConfigString = dbConfigString
	}

	pServer, err = server.New(config, singleUserToken, logger)
	if err != nil {
		logger.Fatal("server.New ERROR", mlog.Err(err))
	}

	if err := pServer.Start(); err != nil {
		logger.Fatal("server.Start ERROR", mlog.Err(err))
	}
}

func stopServer() {
	if pServer == nil {
		return
	}

	err := pServer.Shutdown()
	if err != nil {
		pServer.Logger().Error("server.Shutdown ERROR", mlog.Err(err))
	}
	_ = pServer.Logger().Shutdown()
	pServer = nil
}

func defaultLoggingConfig() string {
	return `
	{
		"def": {
			"type": "console",
			"options": {
				"out": "stdout"
			},
			"format": "plain",
			"format_options": {
				"delim": " ",
				"min_level_len": 5,
				"min_msg_len": 40,
				"enable_color": true				
			},
			"levels": [
				{"id": 5, "name": "debug"},
				{"id": 4, "name": "info", "color": 36},
				{"id": 3, "name": "warn"},
				{"id": 2, "name": "error", "color": 31},
				{"id": 1, "name": "fatal", "stacktrace": true},
				{"id": 0, "name": "panic", "stacktrace": true}
			]
		}
	}`
}
