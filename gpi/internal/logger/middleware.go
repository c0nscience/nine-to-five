package logger

import (
	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
	"net/http"
	"time"
)

func Middleware() mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			start := time.Now()
			next.ServeHTTP(w, req)
			//TODO use this as inspiration to capture the status code https://ndersson.me/post/capturing_status_code_in_net_http/
			log.Info().Msgf("%s %s %dms", req.Method, req.URL.Path, time.Since(start).Milliseconds())
		})
	}
}
