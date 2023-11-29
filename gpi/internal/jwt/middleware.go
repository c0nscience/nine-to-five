package jwt

import (
	"context"
	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/form3tech-oss/jwt-go"
	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
	"net/http"
	"net/url"
	"time"
)

const (
	audience         = "https://api.ntf.io"
	issuer           = "https://ninetofive.eu.auth0.com/"
	keyPath          = "/.well-known/jwks.json"
	contextUserIdKey = "userId"
)

var keyHost = "https://ninetofive.eu.auth0.com"
var timeout = 500 * time.Millisecond

func SetKeyHost(s string) {
	keyHost = s
}

func SetTimeout(d time.Duration) {
	timeout = d
}

type Jwks struct {
	Keys []JsonWebKeys `json:"keys"`
}

type JsonWebKeys struct {
	Kty string   `json:"kty"`
	Kid string   `json:"kid"`
	Use string   `json:"use"`
	N   string   `json:"n"`
	E   string   `json:"e"`
	X5c []string `json:"x5c"`
}

func Middleware() (*jwtmiddleware.JWTMiddleware, error) {
	issuerUrl, err := url.Parse(issuer)
	if err != nil {
		return nil, err
	}

	provider := jwks.NewCachingProvider(issuerUrl, 5*time.Minute)
	jwtValidator, err := validator.New(
		provider.KeyFunc,
		validator.HS256,
		issuer,
		[]string{audience},
		validator.WithAllowedClockSkew(30*time.Second),
	)
	if err != nil {
		return nil, err
	}

	errorHandler := func(w http.ResponseWriter, r *http.Request, err error) {
		log.Error().
			Err(err).
			Msg("Encountered error while validating JWT")
	}

	return jwtmiddleware.New(jwtValidator.ValidateToken,
		jwtmiddleware.WithErrorHandler(errorHandler)), nil
}

func UserIdMiddleware() mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, ok := r.Context().Value("user").(*jwt.Token)

			if !ok {
				http.Error(w, "Token not found", http.StatusBadRequest)
				return
			}

			userId, ok := token.Claims.(jwt.MapClaims)["sub"].(string)

			if !ok {
				http.Error(w, "User Id not found", http.StatusBadRequest)
				return
			}

			newRequest := r.WithContext(context.WithValue(r.Context(), contextUserIdKey, userId))
			*r = *newRequest

			next.ServeHTTP(w, r)
		})
	}
}
