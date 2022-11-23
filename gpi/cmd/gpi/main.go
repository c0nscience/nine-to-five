package main

import (
	"context"
	"fmt"
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/crawler"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwt"
	"github.com/c0nscience/nine-to-five/gpi/internal/logger"
	"github.com/c0nscience/nine-to-five/gpi/internal/metric"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
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

const kidToCache = "9lTfRv8QXd097454kAMMt"

func main() {
	start := time.Now()
	setupLog()

	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}

	dbUri := os.Getenv("DB_URI")
	dbName := os.Getenv("DB_NAME")
	ac, err := store.New(dbUri, dbName, activity.Collection)
	if err != nil {
		log.Panic().Err(err).Msg("Could not create activity store")
	}
	activityClient := store.NewLogged(ac)
	mc, err := store.New(dbUri, dbName, metric.Collection)
	if err != nil {
		log.Panic().Err(err).Msg("Could not create metric store")
	}
	metricClient := store.NewLogged(mc)

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
	r.Handle("/activity/repeat", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Repeat(activityClient)))).Methods("POST", "OPTIONS")
	r.Handle("/activities/tags", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Tags(activityClient)))).Methods("GET", "OPTIONS")
	r.Handle("/activities/{id}", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.Get(activityClient)))).Methods("GET", "OPTIONS")
	r.Handle("/activities/{from}/{to}", jwtMiddleware.Handler(userIdMiddleware.Middleware(activity.InRange(activityClient)))).Methods("GET", "OPTIONS")

	r.Handle("/metrics", jwtMiddleware.Handler(userIdMiddleware.Middleware(metric.List(metricClient)))).Methods("GET", "OPTIONS")
	r.Handle("/metrics", jwtMiddleware.Handler(userIdMiddleware.Middleware(metric.Create(metricClient)))).Methods("POST", "OPTIONS")
	r.Handle("/metrics/{id}", jwtMiddleware.Handler(userIdMiddleware.Middleware(metric.Calculate(metricClient, activityClient)))).Methods("GET", "OPTIONS")
	r.Handle("/metrics/{id}", jwtMiddleware.Handler(userIdMiddleware.Middleware(metric.Update(metricClient)))).Methods("POST", "OPTIONS")
	r.Handle("/metrics/{id}/config", jwtMiddleware.Handler(userIdMiddleware.Middleware(metric.Load(metricClient)))).Methods("GET", "OPTIONS")
	r.Handle("/metrics/{id}", jwtMiddleware.Handler(userIdMiddleware.Middleware(metric.Delete(metricClient)))).Methods("DELETE", "OPTIONS")

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

	crawlerUrl := os.Getenv("CRAWLER_URL")
	size := os.Getenv("SIZE")
	tgChannel := os.Getenv("TELEGRAM_CHANNEL")
	bot, err := tgbotapi.NewBotAPI(os.Getenv("TELEGRAM_APITOKEN"))
	if err == nil {
		log.Info().Msg("Got telegram credentials. Start crawler ...")

		go func() {
			for range time.Tick(time.Second * 30) {
				cli := crawler.New(crawlerUrl)
				log.Info().Msg("test if is in stock")
				if cli.InStock(size) {
					log.Info().Msg("Yes it was in stock.")
					msg := tgbotapi.NewMessageToChannel(tgChannel, fmt.Sprintf("Yay! %s is in stock. GO GO GO - %s", size, crawlerUrl))
					_, err := bot.Send(msg)
					if err != nil {
						log.Error().Err(err)
					}
				} else {
					log.Info().Msg("No it was not in stock.")
				}
			}
		}()
	}

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
