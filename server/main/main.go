package main

import (
	"flag"
	"log"
	"os"
	"syscall"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
)

// ----------------------------------------------------------------------------------------------------
// WebSocket OnChange listener

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

func main() {
	// Log version
	log.Println("Version: " + model.CurrentVersion)
	log.Println("Edition: " + model.Edition)
	log.Println("Build Number: " + model.BuildNumber)
	log.Println("Build Date: " + model.BuildDate)
	log.Println("Build Hash: " + model.BuildHash)

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
}
