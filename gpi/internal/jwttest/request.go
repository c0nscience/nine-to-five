package jwttest

import (
	"bytes"
	"fmt"
	jwtmiddleware "github.com/auth0/go-jwt-middleware"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwt"
	gjwt "github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
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
	s, e := token.SignedString(privateKey)
	if e != nil {
		panic(e)
	}
	req.Header.Set("Authorization", fmt.Sprintf("bearer %v", s))

	resp := httptest.NewRecorder()

	handler := JWT().Handler(jwt.UserIdMiddleware().Middleware(h))
	if pattern == "" {
		handler.ServeHTTP(resp, req)
	} else {
		r := mux.NewRouter()
		r.Handle(pattern, handler).Methods(method)
		r.ServeHTTP(resp, req)
	}

	return resp
}

func JWT() *jwtmiddleware.JWTMiddleware {
	return jwtmiddleware.New(jwtmiddleware.Options{
		Debug:               false,
		CredentialsOptional: false,
		ValidationKeyGetter: func(token *gjwt.Token) (interface{}, error) {
			return privateKey, nil
		},
		SigningMethod: gjwt.SigningMethodHS256,
	})
}

func readPrivateKey() ([]byte, error) {
	return ioutil.ReadFile("keys/test-key")
}
