package jwt

import (
	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/rs/zerolog/log"
	"net/http"
	"net/url"
	"time"
)

const (
	audience = "https://api.ntf.io"
	issuer   = "https://ninetofive.eu.auth0.com/"
)

func Middleware() (*jwtmiddleware.JWTMiddleware, error) {
	issuerUrl, err := url.Parse(issuer)
	if err != nil {
		return nil, err
	}

	provider := jwks.NewCachingProvider(issuerUrl, 5*time.Minute)
	jwtValidator, err := validator.New(
		provider.KeyFunc,
		validator.RS256,
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
