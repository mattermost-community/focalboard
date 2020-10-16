package main

import (
	"flag"
	"syscall"
	"time"

	"log"
	"os"
	"os/signal"
)

var config *Configuration
var wsServer *WSServer
var webServer *WebServer
var api *API
var store *SQLStore

// ----------------------------------------------------------------------------------------------------
// WebSocket OnChange listener

func isProcessRunning(pid int) bool {
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}

	err = process.Signal(syscall.Signal(0))
	if err != nil {
		return false
	}

	return true
}

func monitorPid(pid int) {
	log.Printf("Monitoring PID: %d", pid)
	go func() {
		for {
			if !isProcessRunning(pid) {
				log.Printf("Monitored process not found, exiting.")
				os.Exit(1)
			}
			time.Sleep(2 * time.Second)
		}
	}()
}

func main() {
	// config.json file
	var err error
	config, err = readConfigFile()
	if err != nil {
		log.Fatal("Unable to read the config file: ", err)
		return
	}

	// Command line args
	pMonitorPid := flag.Int("monitorpid", -1, "a process ID")
	pPort := flag.Int("port", config.Port, "the port number")
	flag.Parse()

	if pMonitorPid != nil && *pMonitorPid > 0 {
		monitorPid(*pMonitorPid)
	}

	if pPort != nil && *pPort > 0 && *pPort != config.Port {
		// Override port
		log.Printf("Port from commandline: %d", *pPort)
		config.Port = *pPort
	}

	wsServer = NewWSServer()
	webServer = NewWebServer(config.Port, config.UseSSL)
	api = NewAPI()
	webServer.AddRoutes(api)
	webServer.AddRoutes(wsServer)

	store, err = NewSQLStore(config.DBType, config.DBConfigString)
	if err != nil {
		log.Fatal("Unable to start the database", err)
		panic(err)
	}

	// Ctrl+C handling
	handler := make(chan os.Signal, 1)
	signal.Notify(handler, os.Interrupt)
	go func() {
		for sig := range handler {
			// sig is a ^C, handle it
			if sig == os.Interrupt {
				os.Exit(1)
				break
			}
		}
	}()

	if err := webServer.Start(); err != nil {
		log.Fatal("ListenAndServeTLS: ", err)
	}
}
