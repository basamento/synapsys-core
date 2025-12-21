package main

import (
	"log"
	"net/http"
	"synapsys-core/internal/db"
	"synapsys-core/internal/handler"
	"synapsys-core/internal/repository/sqlite"
	"synapsys-core/internal/server"
	"synapsys-core/internal/service"
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
	// register static frontend pages
	server.RegisterEmbeddedStatic(mux)
	// start the server
	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
