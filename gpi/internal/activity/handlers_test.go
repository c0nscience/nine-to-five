package activity_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	jwtmiddleware "github.com/auth0/go-jwt-middleware"
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/dgrijalva/jwt-go"
	"github.com/stretchr/testify/assert"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

func Test_Start(t *testing.T) {
	var err error
	privateKey, err = readPrivateKey()
	if err != nil {
		panic(err)
	}

	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))

	t.Run("should return started activity", func(t *testing.T) {
		clock.SetTime(300)
		now := clock.Now()

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		resp := makeAuthenticatedRequest(activity.Start(mongoDbCli), "userid", "POST", "/activity", bdy)

		subj := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, http.StatusCreated, resp.Code)
		assert.Equal(t, "userid", subj.UserId)
		assert.Equal(t, "new activity", subj.Name)
		assert.Equal(t, now.Unix(), subj.Start.Unix())
		assert.Equal(t, []string{"tag1", "tag2"}, subj.Tags)

		var stored activity.Activity
		ctx, _ := context.WithTimeout(context.Background(), 100*time.Millisecond)
		err := mongoDbCli.Find(ctx, "userid", subj.Id, &stored)
		assert.NoError(t, err)
		assert.NotNil(t, stored)
		assert.Equal(t, "userid", stored.UserId)
		assert.Equal(t, "new activity", stored.Name)
	})

	t.Run("should return started activity with set start time", func(t *testing.T) {
		bdy := `{"name":"new activity","start":"2021-01-09T10:00:00Z","tags":["tag1","tag2"]}`
		resp := makeAuthenticatedRequest(activity.Start(mongoDbCli), "userid", "POST", "/activity", bdy)

		subj := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, http.StatusCreated, resp.Code)
		assert.Equal(t, "userid", subj.UserId)
		assert.Equal(t, "new activity", subj.Name)
		assert.Equal(t, time.Date(2021, 1, 9, 10, 0, 0, 0, time.UTC).Unix(), subj.Start.Unix())
		assert.Equal(t, []string{"tag1", "tag2"}, subj.Tags)

		var stored activity.Activity
		ctx, _ := context.WithTimeout(context.Background(), 100*time.Millisecond)
		err := mongoDbCli.Find(ctx, "userid", subj.Id, &stored)
		assert.NoError(t, err)
		assert.NotNil(t, stored)
		assert.Equal(t, time.Date(2021, 1, 9, 10, 0, 0, 0, time.UTC).Unix(), stored.Start.Unix())

	})
}

func makeAuthenticatedRequest(h http.HandlerFunc, userId, method, path, body string) *httptest.ResponseRecorder {
	req, _ := http.NewRequest(method, path, bytes.NewBufferString(body))

	token := jwt.New(jwt.SigningMethodHS256)
	token.Claims = jwt.MapClaims{"sub": userId}
	s, e := token.SignedString(privateKey)
	if e != nil {
		panic(e)
	}
	req.Header.Set("Authorization", fmt.Sprintf("bearer %v", s))

	resp := httptest.NewRecorder()

	JWT().Handler(h).ServeHTTP(resp, req)

	return resp
}

var privateKey []byte

func JWT() *jwtmiddleware.JWTMiddleware {
	return jwtmiddleware.New(jwtmiddleware.Options{
		Debug:               false,
		CredentialsOptional: false,
		ValidationKeyGetter: func(token *jwt.Token) (interface{}, error) {
			if privateKey == nil {
				var err error
				privateKey, err = readPrivateKey()
				if err != nil {
					panic(err)
				}
			}
			return privateKey, nil
		},
		SigningMethod: jwt.SigningMethodHS256,
	})
}

func readPrivateKey() ([]byte, error) {
	privateKey, e := ioutil.ReadFile("keys/test-key")
	return privateKey, e
}
