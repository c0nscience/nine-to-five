package main

import (
	"context"
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwt"
	"github.com/c0nscience/nine-to-five/gpi/internal/logger"
	"github.com/c0nscience/nine-to-five/gpi/internal/metric"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/gorilla/mux"
	_ "github.com/heroku/x/hmetrics/onload"
	"github.com/rs/cors"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

const kidToCache = "NTJFQzgyMjFFMDZDQzJCNzdGNjNERTI0ODg2MzEyODY3OEM3NkE1NA"

func main() {
	start := time.Now()
	setupLog()

	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}

	dbUri := os.Getenv("DB_URI")
	dbName := os.Getenv("DB_NAME")
	activityClient := store.NewLogged(store.New(dbUri, dbName, activity.Collection))
	metricClient := store.NewLogged(store.New(dbUri, dbName, metric.Collection))

	r := mux.NewRouter()

	jwtMiddleware, err := jwt.Middleware(kidToCache)
	if err != nil {
		log.Panic().Err(err).Msg("Could not initialize jwt middleware")
	}
	userIdMiddleware := jwt.UserIdMiddleware()
	//TODO define middleware to validate scope: https://auth0.com/docs/quickstart/backend/golang/01-authorization#validate-scopes
	// README: also a good source: https://auth0.com/blog/authentication-in-golang/#Authorization-with-Golang
	// for middlewares https://drstearns.github.io/tutorials/gomiddleware/
	r.Handle("/activity", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Start(activityClient)))).Methods("POST", "OPTIONS")
	r.Handle("/activity/{id}", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Update(activityClient)))).Methods("PUT", "OPTIONS")
	r.Handle("/activity/{id}", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Delete(activityClient)))).Methods("DELETE", "OPTIONS")
	r.Handle("/activity/stop", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Stop(activityClient)))).Methods("POST", "OPTIONS")
	r.Handle("/activity/running", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Running(activityClient)))).Methods("GET", "OPTIONS")
	r.Handle("/activities/tags", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Tags(activityClient)))).Methods("GET", "OPTIONS")
	r.Handle("/activities/{id}", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Get(activityClient)))).Methods("GET", "OPTIONS")
	r.Handle("/activities/{from}/{to}", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.InRange(activityClient)))).Methods("GET", "OPTIONS")

	r.Handle("/metrics/{id}", jwtMiddleware.Handler(userIdMiddleware.Middleware(metric.Calculate(metricClient, activityClient)))).Methods("GET", "OPTIONS")

	corsOpts := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"https://9to5.app",
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodHead,
		},
		AllowedHeaders: []string{"*"},
	})

	r.Use(logger.Middleware())

	httpServer := &http.Server{
		Addr:    ":" + port,
		Handler: corsOpts.Handler(r),
	}

	termChan := make(chan os.Signal)
	signal.Notify(termChan, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		log.Info().Msgf("server is listening at %s", port)
		clock.Track(start, "startup")
		if err := httpServer.ListenAndServe(); err != nil {
			if err != http.ErrServerClosed {
				log.Info().Err(err).Msgf("Server closed")
			}
			log.Info().Msg("Server shut down")
		}
	}()

	<-termChan

	log.Info().Msg("SIGTERM received. Shutdown process initiated")
	ctx, cancel := context.WithCancel(context.Background())
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server shut down failed")
	}
	if err := activityClient.Disconnect(ctx); err != nil {
		log.Fatal().Err(err).Msg("Disconnect from mongodb failed")
	}

	cancel()
}

func setupLog() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}
