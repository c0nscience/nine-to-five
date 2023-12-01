package jwttest

import (
	"bytes"
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/validator"
	gjwt "github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
)

func MakeAuthenticatedRequest(h http.HandlerFunc, userId, method, path, body string) *httptest.ResponseRecorder {
	return MakeAuthenticatedRequestWithPattern(h, "", userId, method, path, body)
}

func MakeAuthenticatedRequestWithPattern(h http.HandlerFunc, pattern, userId, method, path, body string) *httptest.ResponseRecorder {
	var buf io.Reader
	if body != "" {
		buf = bytes.NewBufferString(body)
	}
	req, _ := http.NewRequest(method, path, buf)

	token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.RegisteredClaims{
		Subject:  userId,
		Issuer:   "https://some-issuer",
		Audience: []string{"my-audience"},
	})

	privateKey, publicKey, err := readKeyPair()
	mustNot(err)

	s, err := token.SignedString(privateKey)
	mustNot(err)

	req.Header.Set("Authorization", fmt.Sprintf("bearer %v", s))

	resp := httptest.NewRecorder()

	middleware, err := JWT(publicKey)
	if err != nil {
		panic(err)
	}

	handler := middleware.CheckJWT(h)
	if pattern == "" {
		handler.ServeHTTP(resp, req)
	} else {
		r := mux.NewRouter()
		r.Handle(pattern, handler).Methods(method)
		r.ServeHTTP(resp, req)
	}

	return resp
}

func JWT(publicKey *rsa.PublicKey) (*jwtmiddleware.JWTMiddleware, error) {
	jwtValidator, err := validator.New(
		func(ctx context.Context) (interface{}, error) {
			return publicKey, nil
		},
		validator.RS256,
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

func readKeyPair() (*rsa.PrivateKey, *rsa.PublicKey, error) {
	privateKey, err := readPrivateKey()
	if err != nil {
		return nil, nil, err
	}

	privBlock, _ := pem.Decode(privateKey)
	privKey, err := x509.ParsePKCS1PrivateKey(privBlock.Bytes)
	if err != nil {
		return nil, nil, err
	}

	publicKey, err := readPublicKey()
	if err != nil {
		return nil, nil, err
	}

	pubBlock, _ := pem.Decode(publicKey)

	pubKey, err := x509.ParsePKIXPublicKey(pubBlock.Bytes)
	if err != nil {
		return nil, nil, err
	}

	return privKey, pubKey.(*rsa.PublicKey), nil
}

func readPrivateKey() ([]byte, error) {
	return os.ReadFile("../jwttest/jwtRS256.key")
}
func readPublicKey() ([]byte, error) {
	return os.ReadFile("../jwttest/jwtRS256.key.pub")
}

func mustNot(err error) {
	if err != nil {
		panic(err)
	}
}
