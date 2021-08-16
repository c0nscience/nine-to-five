package jwt_test

import (
	"context"
	"encoding/json"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwt"
	gjwt "github.com/dgrijalva/jwt-go"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"testing"
	"time"
)

func init() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

func Test_JWT_Middleware(t *testing.T) {
	keyId := "keyID"
	var wasCalled = false
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := json.Marshal(jwt.Jwks{
			Keys: []jwt.JsonWebKeys{
				{
					Kid: keyId,
					X5c: []string{
						"MIIDCTCCAfGgAwIBAgIJbct7d4inFBhMMA0GCSqGSIb3DQEBCwUAMCIxIDAeBgNVBAMTF25pbmV0b2ZpdmUuZXUuYXV0aDAuY29tMB4XDTIwMDMxMzEyNDc1MFoXDTMzMTEyMDEyNDc1MFowIjEgMB4GA1UEAxMXbmluZXRvZml2ZS5ldS5hdXRoMC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCxuQ9cfXUJ3K+7wXDiV6te/2XLg8MMCBeXXezebAb8NJt/VYN1dx9JWPOpYWCzbT16FVQF5vs9trgkghueWg7+Bn8RDn88+uC5zSnCNN+S5XtSBfI/J66HALpEDih9WUu6M/IrfvnV9LFkNAnx4uMc1bZINwSf1SXtn/EvyLSGk7MM6i99/0dVQXfz5OhkxOdsiEBoWyLkg8S9Vn4u+C6Qd4zgKeUzjoaYb+B9H9gn9MJYOb6KQk3mXDdudx3imOBmLTJue3xFYBMpGR/tQI0YpXfXAZ+xBiTdnA9T+kohuqzEcmWpvATIG+iPLxY37acGuUubG0Q8mphizdhsW9kzAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFJ6oSWR1549bI+wNlolVwwI2akGvMA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEARZxVtkHwBKYZWG6m+UEzAQgrCZoaVwrWwTXGIyv9kluOAJ3ooh3TkKU1zAmwIuWUVRu9uFY6y/tFe5QBBDNPjhfa0O0yg4/timDZl/rgspUE2SQqr/KjL84vJu9K1HzinNZcnMAxfIZWmftK7HnopS/1idWjDh+ztIQIGiCYFlb1SWMqc8XuqwTZNzeeTV99dYXbQ6PyoOZLBuP2CmVclX7QqIEriHhHV+MsdZCKWEETeUwmx91sBAIZtg2pA4KJJDR4mzItH1jU8c18C2ZrI/Rv0rr+U2JhTYhl8xX9B339lS+ijehtX+7wYOfYjEX/Imry+sGwypP/Z3lZntDvJw==",
					},
				},
			},
		})
		w.Write(b)
		wasCalled = true
	}))
	t.Cleanup(func() {
		ts.Close()
	})
	cache := &sync.Map{}

	t.Run("should return public key", func(t *testing.T) {
		jwt.SetTimeout(500 * time.Millisecond)
		jwt.SetKeyHost(ts.URL)

		token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.MapClaims{
			"aud": "https://api.ntf.io",
			"iss": "https://ninetofive.eu.auth0.com/",
		})
		token.Header["kid"] = keyId
		key, err := jwt.ValidationKeyGetter(cache)(token)

		assert.NoError(t, err)
		assert.NotNil(t, key)
		wasCalled = false
	})

	t.Run("should return public key from cache", func(t *testing.T) {
		jwt.SetTimeout(500 * time.Millisecond)
		jwt.SetKeyHost(ts.URL)

		token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.MapClaims{
			"aud": "https://api.ntf.io",
			"iss": "https://ninetofive.eu.auth0.com/",
		})
		token.Header["kid"] = keyId
		key, err := jwt.ValidationKeyGetter(cache)(token)

		assert.NoError(t, err)
		assert.NotNil(t, key)
		assert.False(t, wasCalled)
		wasCalled = false
	})

	t.Run("should fail for invalid audience", func(t *testing.T) {
		jwt.SetTimeout(500 * time.Millisecond)
		jwt.SetKeyHost(ts.URL)

		token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.MapClaims{
			"aud": "https://wrong.audience.com",
			"iss": "https://ninetofive.eu.auth0.com/",
		})
		token.Header["kid"] = keyId
		_, err := jwt.ValidationKeyGetter(cache)(token)

		assert.Error(t, err)
	})

	t.Run("should fail for invalid issuer", func(t *testing.T) {
		jwt.SetTimeout(500 * time.Millisecond)
		jwt.SetKeyHost(ts.URL)

		token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.MapClaims{
			"aud": "https://api.ntf.io",
			"iss": "https://wrong.issuer.com/",
		})
		token.Header["kid"] = keyId
		_, err := jwt.ValidationKeyGetter(cache)(token)

		assert.Error(t, err)
	})

	t.Run("should fail for missing key", func(t *testing.T) {
		jwt.SetTimeout(500 * time.Millisecond)
		jwt.SetKeyHost(ts.URL)

		token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.MapClaims{
			"aud": "https://api.ntf.io",
			"iss": "https://ninetofive.eu.auth0.com/",
		})
		token.Header["kid"] = "anotherKeyId"
		_, err := jwt.ValidationKeyGetter(cache)(token)

		assert.Error(t, err)
	})

	t.Run("should fail if public key can not be fetched", func(t *testing.T) {
		jwt.SetTimeout(1 * time.Millisecond)
		jwt.SetKeyHost("http://notexisting")

		token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.MapClaims{
			"aud": "https://api.ntf.io",
			"iss": "https://ninetofive.eu.auth0.com/",
		})
		token.Header["kid"] = "anotherKeyId"
		_, err := jwt.ValidationKeyGetter(cache)(token)

		assert.Error(t, err)
	})

	t.Run("should fail for malformed json", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte(`[{"wrong":"json"]}`))
		}))
		defer ts.Close()
		jwt.SetTimeout(500 * time.Millisecond)
		jwt.SetKeyHost(ts.URL)

		token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.MapClaims{
			"aud": "https://api.ntf.io",
			"iss": "https://ninetofive.eu.auth0.com/",
		})
		token.Header["kid"] = "anotherKeyId"
		_, err := jwt.ValidationKeyGetter(cache)(token)

		assert.Error(t, err)
	})
}

func TestUserIdMiddleware(t *testing.T) {
	middleware := jwt.UserIdMiddleware()
	var recordedUserId = ""
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		recordedUserId = r.Context().Value("userId").(string)
	})
	jwt.SetTimeout(500 * time.Millisecond)

	t.Run("should put user id into context", func(t *testing.T) {
		token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.MapClaims{
			"sub": "user-id",
		})

		r := httptest.NewRequest("GET", "/", nil)
		req := r.
			WithContext(context.WithValue(r.Context(), "user", token))
		resp := httptest.NewRecorder()
		middleware.
			Middleware(handler).
			ServeHTTP(resp, req)

		assert.Equal(t, http.StatusOK, resp.Code)
		assert.Equal(t, "user-id", recordedUserId)
		recordedUserId = ""
	})

	t.Run("should return bad request if user id could not be found", func(t *testing.T) {
		token := gjwt.NewWithClaims(gjwt.SigningMethodRS256, gjwt.MapClaims{})

		r := httptest.NewRequest("GET", "/", nil)
		req := r.
			WithContext(context.WithValue(r.Context(), "user", token))
		resp := httptest.NewRecorder()
		middleware.
			Middleware(handler).
			ServeHTTP(resp, req)

		assert.Equal(t, http.StatusBadRequest, resp.Code)
		assert.Empty(t, recordedUserId)
		recordedUserId = ""
	})

	t.Run("should return bad request if token is not present", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		resp := httptest.NewRecorder()
		middleware.
			Middleware(handler).
			ServeHTTP(resp, req)

		assert.Equal(t, http.StatusBadRequest, resp.Code)
	})
}
