package config

import (
	"log"

	"github.com/spf13/viper"
)

const (
	DefaultServerRoot = "http://localhost:8000"
	DefaultPort       = 8000
)

// Configuration is the app configuration stored in a json file.
type Configuration struct {
	ServerRoot     string `json:"serverRoot" mapstructure:"serverRoot"`
	Port           int    `json:"port" mapstructure:"port"`
	DBType         string `json:"dbtype" mapstructure:"dbtype"`
	DBConfigString string `json:"dbconfig" mapstructure:"dbconfig"`
	UseSSL         bool   `json:"useSSL" mapstructure:"useSSL"`
	WebPath        string `json:"webpath" mapstructure:"webpath"`
	FilesPath      string `json:"filespath" mapstructure:"filespath"`
	Telemetry      bool   `json:"telemetry" mapstructure:"telemetry"`
}

// ReadConfigFile read the configuration from the filesystem.
func ReadConfigFile() (*Configuration, error) {
	viper.SetConfigName("config") // name of config file (without extension)
	viper.SetConfigType("json")   // REQUIRED if the config file does not have the extension in the name
	viper.AddConfigPath(".")      // optionally look for config in the working directory
	viper.SetDefault("ServerRoot", DefaultServerRoot)
	viper.SetDefault("Port", DefaultPort)
	viper.SetDefault("DBType", "sqlite3")
	viper.SetDefault("DBConfigString", "./octo.db")
	viper.SetDefault("WebPath", "./pack")
	viper.SetDefault("FilesPath", "./files")

	err := viper.ReadInConfig() // Find and read the config file
	if err != nil {             // Handle errors reading the config file
		return nil, err
	}

	configuration := Configuration{}

	err = viper.Unmarshal(&configuration)
	if err != nil {
		return nil, err
	}

	log.Println("readConfigFile")
	log.Printf("%+v", configuration)

	return &configuration, nil
}
