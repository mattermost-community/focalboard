package main

import (
	"flag"
	"syscall"
	"time"

	"log"
	"os"

	"github.com/mattermost/mattermost-octo-tasks/server/server"
	"github.com/mattermost/mattermost-octo-tasks/server/services/config"
)

// ----------------------------------------------------------------------------------------------------
// WebSocket OnChange listener

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
			time.Sleep(2 * time.Second)
		}
	}()
}

func main() {
	// config.json file
	config, err := config.ReadConfigFile()
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

	server, err := server.New(config)
	if err != nil {
		log.Fatal("ListenAndServeTLS: ", err)
	}

	if err := server.Start(); err != nil {
		log.Fatal("ListenAndServeTLS: ", err)
	}
}
