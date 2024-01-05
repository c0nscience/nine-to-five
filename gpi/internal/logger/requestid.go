package logger

import (
	"context"
	"github.com/gorilla/mux"
	"net/http"
)

type key struct{}

func RequestId() mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			reqId := req.Header.Get("X-Request-ID")
			r := req.Clone(context.WithValue(req.Context(), key{}, reqId))
			next.ServeHTTP(w, r)
		})
	}
}

func GetRequestId(ctx context.Context) string {
	value, ok := ctx.Value(key{}).(string)
	if !ok {
		return ""
	}

	return value
}
