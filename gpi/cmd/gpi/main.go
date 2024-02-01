package main

import (
	"context"
	"errors"
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwt"
	"github.com/c0nscience/nine-to-five/gpi/internal/logger"
	"github.com/c0nscience/nine-to-five/gpi/internal/metric"
	"github.com/c0nscience/nine-to-five/gpi/internal/ping"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/gorilla/mux"
	_ "github.com/heroku/x/hmetrics/onload"
	"github.com/newrelic/go-agent/v3/integrations/nrgorilla"
	"github.com/newrelic/go-agent/v3/newrelic"
	"github.com/rs/cors"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	start := time.Now()
	setupLog()

	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}

	nrLicenseKey := os.Getenv("NEW_RELIC_LICENSE_KEY")
	var nrapp *newrelic.Application
	if len(nrLicenseKey) > 0 {
		log.Info().Msg("configure newrelic client")
		app, err := newrelic.NewApplication(
			newrelic.ConfigAppName("ntf-gpi"),
			newrelic.ConfigLicense(nrLicenseKey),
			newrelic.ConfigAppLogForwardingEnabled(true),
		)
		if err != nil {
			log.Error().Err(err).Msg("could not configure newrelic client")
		}
		nrapp = app
	}

	dbUri := os.Getenv("DB_URI")
	dbName := os.Getenv("DB_NAME")
	ac, err := store.New(dbUri, dbName, activity.Collection)
	if err != nil {
		log.Panic().Err(err).Msg("Could not create activity store")
	}
	activityClient := store.NewLogged(ac)
	if nrapp != nil {
		activityClient = store.NewNewrelicStore(nrapp, activityClient)
	}

	mc, err := store.New(dbUri, dbName, metric.Collection)
	if err != nil {
		log.Panic().Err(err).Msg("Could not create metric store")
	}
	metricClient := store.NewLogged(mc)
	if nrapp != nil {
		metricClient = store.NewNewrelicStore(nrapp, metricClient)
	}

	r := mux.NewRouter()
	if nrapp != nil {
		r.Use(nrgorilla.Middleware(nrapp))
	}
	r.Use(
		logger.RequestId(),
		logger.Middleware(),
	)

	jwtMiddleware, err := jwt.Middleware()
	if err != nil {
		log.Panic().Err(err).Msg("Could not initialize jwt middleware")
	}

	//TODO define middleware to validate scope: https://auth0.com/docs/quickstart/backend/golang/01-authorization#validate-scopes
	// README: also a good source: https://auth0.com/blog/authentication-in-golang/#Authorization-with-Golang
	// for middlewares https://drstearns.github.io/tutorials/gomiddleware/
	subRouter := r.PathPrefix("/").Subrouter()
	subRouter.Use(
		jwtMiddleware.CheckJWT,
	)
	subRouter.Handle("/activity", activity.Start(activityClient)).Methods("POST", "OPTIONS")
	subRouter.Handle("/activity/{id}", activity.Update(activityClient)).Methods("PUT", "OPTIONS")
	subRouter.Handle("/activity/{id}", activity.Delete(activityClient)).Methods("DELETE", "OPTIONS")
	subRouter.Handle("/activity/stop", activity.Stop(activityClient)).Methods("POST", "OPTIONS")
	subRouter.Handle("/activity/running", activity.Running(activityClient)).Methods("GET", "OPTIONS")
	subRouter.Handle("/activity/repeat", activity.Repeat(activityClient)).Methods("POST", "OPTIONS")
	subRouter.Handle("/activities/tags", activity.Tags(activityClient)).Methods("GET", "OPTIONS")
	subRouter.Handle("/activities/{id}", activity.Get(activityClient)).Methods("GET", "OPTIONS")
	subRouter.Handle("/activities/{from}/{to}", activity.InRange(activityClient)).Methods("GET", "OPTIONS")

	subRouter.Handle("/metrics", metric.List(metricClient)).Methods("GET", "OPTIONS")
	subRouter.Handle("/metrics", metric.Create(metricClient)).Methods("POST", "OPTIONS")
	subRouter.Handle("/metrics/{id}", metric.Calculate(metricClient, activityClient)).Methods("GET", "OPTIONS")
	subRouter.Handle("/metrics/{id}", metric.Update(metricClient)).Methods("POST", "OPTIONS")
	subRouter.Handle("/metrics/{id}/config", metric.Load(metricClient)).Methods("GET", "OPTIONS")
	subRouter.Handle("/metrics/{id}", metric.Delete(metricClient)).Methods("DELETE", "OPTIONS")

	r.Handle("/ping", ping.Handler()).Methods("GET")

	corsOpts := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"https://9to5.app",
			"https://nine-to-five-svelte-conscience.vercel.app",
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

	httpServer := &http.Server{
		Addr:    ":" + port,
		Handler: corsOpts.Handler(r),
	}

	termChan := make(chan os.Signal, 1)
	signal.Notify(termChan, syscall.SIGTERM, syscall.SIGINT)

	go func() {
		log.Info().Msgf("server is listening at %s", port)
		clock.Track(start, "startup")
		if err := httpServer.ListenAndServe(); err != nil {
			if !errors.Is(err, http.ErrServerClosed) {
				log.Info().Err(err).Msgf("Server closed")
			}
			log.Info().Msg("Server shut down")
		}
	}()

	go func() {
		if os.Getenv("POPULATE") == "true" {
			log.Info().Msg("Populate database")
			ctx := context.Background()
			userId := "auth0|59ac17508f649c3f85124ec1"
			err := activity.CreateAll(ctx, userId, 3, 30, time.Minute, []string{"acme", "meeting"},
				func() time.Time {
					n := time.Now().UTC()
					d := time.Date(n.Year(), n.Month(), n.Day(), 8, 30, 0, 0, n.Location())
					return metric.AdjustToStartOfWeek(d).AddDate(0, 0, -7)
				},
				func(ctx context.Context, userId string, act activity.Activity) error {
					_, err := activityClient.Save(ctx, userId, &act)
					if err != nil {
						return err
					}
					return nil
				})
			if err != nil {
				log.Err(err).Msg("could not populate data")
			}
		}
	}()

	<-termChan

	log.Info().Msg("SIGTERM received. Shutdown process initiated")
	ctx, cancel := context.WithCancel(context.Background())
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server shutdown failed")
	}
	if err := activityClient.Disconnect(ctx); err != nil {
		log.Fatal().Err(err).Msg("Disconnect from mongodb failed")
	}

	cancel()
}

func setupLog() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339, NoColor: os.Getenv("NO_COLOR") == "true"})
}
