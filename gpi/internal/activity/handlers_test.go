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
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

func init() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

const timeout = 100 * time.Millisecond

func Test_Start(t *testing.T) {
	var err error
	privateKey, err = readPrivateKey()
	if err != nil {
		panic(err)
	}

	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))

	userId := "userid"
	t.Run("should return started activity", func(t *testing.T) {
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		defer mongoDbCli.DeleteAll(ctx, userId)
		clock.SetTime(300)
		now := clock.Now()

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		resp := makeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		subj := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, http.StatusCreated, resp.Code)
		assert.Equal(t, userId, subj.UserId)
		assert.Equal(t, "new activity", subj.Name)
		assert.Equal(t, now.Unix(), subj.Start.Unix())
		assert.Equal(t, []string{"tag1", "tag2"}, subj.Tags)

		var stored activity.Activity
		err := mongoDbCli.Find(ctx, userId, bson.M{"_id": subj.Id}, &stored)
		assert.NoError(t, err)
		assert.NotNil(t, stored)
		assert.Equal(t, userId, stored.UserId)
		assert.Equal(t, "new activity", stored.Name)
	})

	t.Run("should return started activity with set start time", func(t *testing.T) {
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		defer mongoDbCli.DeleteAll(ctx, userId)

		bdy := `{"name":"new activity","start":"2021-01-09T10:00:00Z","tags":["tag1","tag2"]}`
		resp := makeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		subj := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, http.StatusCreated, resp.Code)
		assert.Equal(t, userId, subj.UserId)
		assert.Equal(t, "new activity", subj.Name)
		assert.Equal(t, time.Date(2021, 1, 9, 10, 0, 0, 0, time.UTC).Unix(), subj.Start.Unix())
		assert.Equal(t, []string{"tag1", "tag2"}, subj.Tags)

		var stored activity.Activity
		err := mongoDbCli.Find(ctx, userId, bson.M{"_id": subj.Id}, &stored)
		assert.NoError(t, err)
		assert.NotNil(t, stored)
		assert.Equal(t, time.Date(2021, 1, 9, 10, 0, 0, 0, time.UTC).Unix(), stored.Start.Unix())
	})

	t.Run("should return bad request if another activity is already running", func(t *testing.T) {
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		defer mongoDbCli.DeleteAll(ctx, userId)

		makeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"new activity","start":"2021-01-09T10:00:00Z","tags":["tag1","tag2"]}`)
		resp := makeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"new activity2","start":"2021-01-09T10:00:00Z","tags":["tag1","tag2"]}`)

		assert.Equal(t, http.StatusBadRequest, resp.Code)
	})
}

func Test_Stop(t *testing.T) {
	var err error
	privateKey, err = readPrivateKey()
	if err != nil {
		panic(err)
	}

	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))

	t.Run("should set the end date to the current date of the current running activity", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		defer mongoDbCli.DeleteAll(ctx, userId)

		clock.SetTime(300)

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		makeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		clock.SetTime(600)
		now := clock.Now()
		resp := makeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")

		assert.Equal(t, http.StatusOK, resp.Code)

		subj := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, now.Unix(), subj.End.Unix())
	})

	t.Run("should do nothing if no activity runs", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		defer mongoDbCli.DeleteAll(ctx, userId)

		resp := makeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")
		assert.Equal(t, http.StatusOK, resp.Code)
	})
}

func Test_Running(t *testing.T) {
	var err error
	privateKey, err = readPrivateKey()
	if err != nil {
		panic(err)
	}

	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))

	t.Run("should return currently running activity", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		defer mongoDbCli.DeleteAll(ctx, userId)

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		startResp := makeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		startAct := activity.Activity{}
		json.Unmarshal(startResp.Body.Bytes(), &startAct)

		resp := makeAuthenticatedRequest(activity.Running(mongoDbCli), userId, "GET", "/activity/running", "")

		assert.Equal(t, http.StatusOK, resp.Code)

		subj := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, startAct.Id.Hex(), subj.Id.Hex())
	})

	t.Run("should return not found if no activity is running", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		defer mongoDbCli.DeleteAll(ctx, userId)

		resp := makeAuthenticatedRequest(activity.Running(mongoDbCli), userId, "GET", "/activity/running", "")

		assert.Equal(t, http.StatusNotFound, resp.Code)
	})
}

func makeAuthenticatedRequest(h http.HandlerFunc, userId, method, path, body string) *httptest.ResponseRecorder {
	var buf io.Reader
	if body != "" {
		buf = bytes.NewBufferString(body)
	}
	req, _ := http.NewRequest(method, path, buf)

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
