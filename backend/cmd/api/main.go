package main

import (
	"log"
	"net/http"
	"os"
	"synapsys-core/internal/auth"
	"synapsys-core/internal/db"
	"synapsys-core/internal/handler"
	"synapsys-core/internal/repository/sqlite"
	"synapsys-core/internal/server"
	"synapsys-core/internal/service"
	"synapsys-core/web"
)

func main() {
	// open database connection
	database, err := db.Open("file:data/nucleus.db?_foreign_keys=on")
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()
	// run migrations
	if err := db.RunMigrations(database); err != nil {
		log.Fatal(err)
	}
	authConfig, err := auth.LoadConfig()
	if err != nil {
		log.Fatal(err)
	}
	authService, err := auth.NewService(database, authConfig)
	if err != nil {
		log.Fatal(err)
	}
	// create server
	mux := server.New()
	authService.Register(mux)
	authService.RegisterWorkerTokenRoutes(mux, authService.RequireUI)
	// register health
	healthService := service.NewHealthService()
	healthHandler := handler.NewHealthHandler(healthService)
	server.RegisterHealth(mux, healthHandler)
	// register processes
	processRepository := sqlite.NewProcessRepository(database)
	processService := service.NewProcessService(processRepository)
	processHandler := handler.NewProcessHandler(processService)
	server.RegisterProcesses(mux, processHandler, authService.RequireUI, authService.RequireWorker)
	// register app state
	stateService := service.NewStateService(processRepository)
	stateHandler := handler.NewStateHandler(stateService)
	server.RegisterState(mux, stateHandler, authService.RequireUI)
	logService := service.NewLogService(processRepository)
	logHandler := handler.NewLogHandler(logService)
	server.RegisterLogs(mux, logHandler, authService.RequireUI)
	// register static frontend pages
	web.RegisterEmbeddedStatic(mux)
	// start the server
	address := ":" + listenPort()
	log.Printf("Listening on %s", address)
	log.Fatal(http.ListenAndServe(address, server.WithCORS(mux)))
}

// listenPort lets a second instance run alongside the default one, which is
// what the dev tooling needs when 8080 is already taken.
func listenPort() string {
	if port := os.Getenv("PORT"); port != "" {
		return port
	}
	return defaultPort
}

const defaultPort = "8080"
