package jwt

import (
	"context"
	"encoding/json"
	"errors"
	jwtmiddleware "github.com/auth0/go-jwt-middleware"
	"github.com/dgrijalva/jwt-go"
	"github.com/rs/zerolog/log"
	"net/http"
	"time"
)

const audience = "https://api.ntf.io"
const issuer = "https://ninetofive.eu.auth0.com/"
const keyPath = "/.well-known/jwks.json"

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

func Middleware() *jwtmiddleware.JWTMiddleware {
	return jwtmiddleware.New(jwtmiddleware.Options{
		ValidationKeyGetter: validationKeyGetter,
		SigningMethod:       jwt.SigningMethodRS256,
	})
}

func validationKeyGetter(token *jwt.Token) (interface{}, error) {
	checkAud := token.Claims.(jwt.MapClaims).VerifyAudience(audience, false)

	if !checkAud {
		err := errors.New("Invalid Audience")
		log.Error().Err(err)
		return token, err
	}

	checkIss := token.Claims.(jwt.MapClaims).VerifyIssuer(issuer, false)

	if !checkIss {
		err := errors.New("Invalid Issuer")
		log.Error().Err(err)
		return token, err
	}

	cert, err := getPemCert(token)
	if err != nil {
		log.Error().Err(err)
		return nil, err
	}

	res, _ := jwt.ParseRSAPublicKeyFromPEM([]byte(cert))
	return res, nil
}

func getPemCert(token *jwt.Token) (string, error) {
	cert := ""

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, "GET", keyHost+keyPath, nil)
	resp, err := http.DefaultClient.Do(req)

	if err != nil {
		return cert, err
	}
	defer resp.Body.Close()

	var jwks = Jwks{}
	err = json.NewDecoder(resp.Body).Decode(&jwks)

	if err != nil {
		return cert, err
	}

	for k, _ := range jwks.Keys {
		if token.Header["kid"] == jwks.Keys[k].Kid {
			cert = "-----BEGIN CERTIFICATE-----\n" +
				jwks.Keys[k].X5c[0] +
				"\n-----END CERTIFICATE-----"
		}
	}

	if cert == "" {
		return cert, errors.New("Unable to find correct key")
	}

	return cert, nil
}
