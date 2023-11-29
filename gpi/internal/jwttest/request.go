package jwttest

import (
	"bytes"
	"context"
	"fmt"
	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwt"
	gjwt "github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
)

var privateKey []byte

func init() {
	var err error
	privateKey, err = readPrivateKey()
	if err != nil {
		panic(err)
	}
}

func MakeAuthenticatedRequest(h http.HandlerFunc, userId, method, path, body string) *httptest.ResponseRecorder {
	return MakeAuthenticatedRequestWithPattern(h, "", userId, method, path, body)
}

func MakeAuthenticatedRequestWithPattern(h http.HandlerFunc, pattern, userId, method, path, body string) *httptest.ResponseRecorder {
	var buf io.Reader
	if body != "" {
		buf = bytes.NewBufferString(body)
	}
	req, _ := http.NewRequest(method, path, buf)

	token := gjwt.New(gjwt.SigningMethodHS256)
	token.Claims = gjwt.MapClaims{"sub": userId}
	s, err := token.SignedString(privateKey)
	if err != nil {
		panic(err)
	}
	req.Header.Set("Authorization", fmt.Sprintf("bearer %v", s))

	resp := httptest.NewRecorder()

	middleware, err := JWT()
	if err != nil {
		panic(err)
	}
	handler := middleware.CheckJWT(jwt.UserIdMiddleware().Middleware(h))
	if pattern == "" {
		handler.ServeHTTP(resp, req)
	} else {
		r := mux.NewRouter()
		r.Handle(pattern, handler).Methods(method)
		r.ServeHTTP(resp, req)
	}

	return resp
}

func JWT() (*jwtmiddleware.JWTMiddleware, error) {
	jwtValidator, err := validator.New(
		func(ctx context.Context) (interface{}, error) {
			return privateKey, nil
		},
		validator.HS256,
		"https://some-issuer",
		[]string{"my-audience"},
	)

	if err != nil {
		return nil, err
	}

	return jwtmiddleware.New(
		jwtValidator.ValidateToken,
		jwtmiddleware.WithCredentialsOptional(false),
	), nil
}

func readPrivateKey() ([]byte, error) {
	return os.ReadFile("keys/test-key")
}
