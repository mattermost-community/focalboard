package main

import (
	"log"
	"os"
	"os/signal"
)

type Server struct {
	config    *Configuration
	wsServer  *WSServer
	webServer *WebServer
	store     *SQLStore
}

func NewServer(config *Configuration) (*Server, error) {
	store, err := NewSQLStore(config.DBType, config.DBConfigString)
	if err != nil {
		log.Fatal("Unable to start the database", err)
		return nil, err
	}

	wsServer := NewWSServer()

	appBuilder := func() *App { return &App{config: config, store: store, wsServer: wsServer} }

	webServer := NewWebServer(config.WebPath, config.Port, config.UseSSL)
	api := NewAPI(appBuilder)
	webServer.AddRoutes(wsServer)
	webServer.AddRoutes(api)

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

	return &Server{
		config:    config,
		wsServer:  wsServer,
		webServer: webServer,
		store:     store,
	}, nil
}

func (s *Server) Start() error {
	if err := s.webServer.Start(); err != nil {
		return err
	}
	return nil
}
