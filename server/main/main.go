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
func monitorPid(pid int) {
	log.Printf("Monitoring PID: %d", pid)

	go func() {
		for {
			if !isProcessRunning(pid) {
				log.Printf("Monitored process not found, exiting.")
				os.Exit(1)
			}

			time.Sleep(timeBetweenPidMonitoringChecks)
		}
	}()
}

func logInfo() {
	log.Println("Focalboard Server")
	log.Println("Version: " + model.CurrentVersion)
	log.Println("Edition: " + model.Edition)
	log.Println("Build Number: " + model.BuildNumber)
	log.Println("Build Date: " + model.BuildDate)
	log.Println("Build Hash: " + model.BuildHash)
}

func main() {
	logInfo()

	// config.json file
	config, err := config.ReadConfigFile()
	if err != nil {
		log.Fatal("Unable to read the config file: ", err)
		return
	}

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
			log.Fatal("The FOCALBOARD_SINGLE_USER_TOKEN environment variable must be set for single user mode ")
			return
		}
		log.Printf("Single user mode")
	}

	if pMonitorPid != nil && *pMonitorPid > 0 {
		monitorPid(*pMonitorPid)
	}

	// Override config from commandline

	if pDBType != nil && len(*pDBType) > 0 {
		config.DBType = *pDBType
		log.Printf("DBType from commandline: %s", *pDBType)
	}

	if pDBConfig != nil && len(*pDBConfig) > 0 {
		config.DBConfigString = *pDBConfig
		// Don't echo, as the confix string may contain passwords
		log.Printf("DBConfigString overriden from commandline")
	}

	if pPort != nil && *pPort > 0 && *pPort != config.Port {
		// Override port
		log.Printf("Port from commandline: %d", *pPort)
		config.Port = *pPort
	}

	server, err := server.New(config, singleUserToken)
	if err != nil {
		log.Fatal("server.New ERROR: ", err)
	}

	if err := server.Start(); err != nil {
		log.Fatal("server.Start ERROR: ", err)
	}

	// Setting up signal capturing
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)

	// Waiting for SIGINT (pkill -2)
	<-stop

	server.Shutdown()
}

// StartServer starts the server
//export StartServer
func StartServer(webPath *C.char, port int, singleUserToken, dbConfigString *C.char) {
	startServer(
		C.GoString(webPath),
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

func startServer(webPath string, port int, singleUserToken, dbConfigString string) {
	logInfo()

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

	if len(webPath) > 0 {
		config.WebPath = webPath
	}

	if port > 0 {
		config.Port = port
	}

	if len(dbConfigString) > 0 {
		config.DBConfigString = dbConfigString
	}

	pServer, err = server.New(config, singleUserToken)
	if err != nil {
		log.Fatal("server.New ERROR: ", err)
	}

	if err := pServer.Start(); err != nil {
		log.Fatal("server.Start ERROR: ", err)
	}
}

func stopServer() {
	if pServer == nil {
		return
	}

	err := pServer.Shutdown()
	if err != nil {
		log.Fatal("server.Shutdown ERROR: ", err)
	}
}
