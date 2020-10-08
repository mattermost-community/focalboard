package main

import (
	"encoding/json"
	"log"
	"os"
)

// Configuration is the app configuration stored in a json file
type Configuration struct {
	ServerRoot     string `json:"serverRoot"`
	Port           int    `json:"port"`
	DBType         string `json:"dbtype"`
	DBConfigString string `json:"dbconfig"`
	UseSSL         bool   `json:"useSSL"`
	WebPath        string `json:"webpath"`
	FilesPath      string `json:"filespath"`
}

func readConfigFile() Configuration {
	fileName := "config.json"
	if !fileExists(fileName) {
		log.Println(`config.json not found, using default settings`)
		return Configuration{}
	}

	file, _ := os.Open(fileName)
	defer file.Close()
	decoder := json.NewDecoder(file)
	configuration := Configuration{}
	err := decoder.Decode(&configuration)
	if err != nil {
		log.Fatal("Invalid config.json", err)
	}

	// Apply defaults
	if len(configuration.ServerRoot) < 1 {
		configuration.ServerRoot = "http://localhost"
	}

	if configuration.Port == 0 {
		configuration.Port = 8000
	}

	if len(configuration.DBType) < 1 {
		configuration.DBType = "sqlite3"
	}

	if len(configuration.DBConfigString) < 1 {
		configuration.DBConfigString = "./octo.db"
	}

	if len(configuration.WebPath) < 1 {
		configuration.WebPath = "./pack"
	}

	if len(configuration.FilesPath) < 1 {
		configuration.FilesPath = "./files"
	}

	log.Println("readConfigFile")
	log.Printf("%+v", configuration)

	return configuration
}
