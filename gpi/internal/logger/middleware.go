package logger

import (
	"fmt"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/gorilla/mux"
	"net/http"
	"time"
)

func Middleware() mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			defer clock.Track(time.Now(), fmt.Sprintf("%s::%s", req.Method, req.URL.Path))
			next.ServeHTTP(w, req)
			//TODO use this as inspiration to capture the status code https://ndersson.me/post/capturing_status_code_in_net_http/
		})
	}
}
