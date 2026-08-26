package main

import (
	"log"
	"net/http"
	"os"
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
	// create server
	mux := server.New()
	// register health
	healthService := service.NewHealthService()
	healthHandler := handler.NewHealthHandler(healthService)
	server.RegisterHealth(mux, healthHandler)
	// register neurons
	neuronRepository := sqlite.NewNeuronRepository(database)
	neuronService := service.NewNeuronsService(neuronRepository)
	neuronHandler := handler.NewNeuronHandler(neuronService)
	server.RegisterNeurons(mux, neuronHandler)
	// register app state
	stateService := service.NewStateService(neuronRepository)
	stateHandler := handler.NewStateHandler(stateService)
	server.RegisterState(mux, stateHandler)
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
