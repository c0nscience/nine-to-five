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
	"github.com/gorilla/mux"
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
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
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
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

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
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

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
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

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
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

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
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

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
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

		resp := makeAuthenticatedRequest(activity.Running(mongoDbCli), userId, "GET", "/activity/running", "")

		assert.Equal(t, http.StatusNotFound, resp.Code)
	})
}

func Test_Get(t *testing.T) {
	var err error
	privateKey, err = readPrivateKey()
	if err != nil {
		panic(err)
	}

	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))

	t.Run("should return activity by id", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		startResp := makeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		startAct := activity.Activity{}
		json.Unmarshal(startResp.Body.Bytes(), &startAct)

		resp := makeAuthenticatedRequestWithPattern(activity.Get(mongoDbCli), "/activities/{id}", userId, "GET", "/activities/"+startAct.Id.Hex(), "")

		assert.Equal(t, http.StatusOK, resp.Code)

		subj := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, startAct, subj)
	})

	t.Run("should return not found if activity does not exist", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

		resp := makeAuthenticatedRequestWithPattern(activity.Get(mongoDbCli), "/activities/{id}", userId, "GET", "/activities/notexisting", "")

		assert.Equal(t, http.StatusNotFound, resp.Code)
	})
}

func Test_Update(t *testing.T) {
	var err error
	privateKey, err = readPrivateKey()
	if err != nil {
		panic(err)
	}

	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))
	const dateFmt = "2006-01-02T15:04:05Z"

	t.Run("should update", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		makeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)
		actResp := makeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")
		act := activity.Activity{}
		json.Unmarshal(actResp.Body.Bytes(), &act)

		t.Run("name", func(t *testing.T) {
			tags, _ := json.Marshal(act.Tags)
			updateBdy := fmt.Sprintf(`{"name":"%s","start":"%s","end":"%s","tags":%s}`, "updated name", act.Start.Format(dateFmt), act.End.Format(dateFmt), string(tags))
			resp := makeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

			assert.Equal(t, http.StatusOK, resp.Code)

			subj := activity.Activity{}
			json.Unmarshal(resp.Body.Bytes(), &subj)

			assert.Equal(t, "updated name", subj.Name)
		})

		t.Run("start", func(t *testing.T) {
			tags, _ := json.Marshal(act.Tags)
			now := time.Now().UTC()
			updateBdy := fmt.Sprintf(`{"name":"%s","start":"%s","end":"%s","tags":%s}`, "updated name", now.Format(dateFmt), act.End.Format(dateFmt), string(tags))
			resp := makeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

			assert.Equal(t, http.StatusOK, resp.Code)

			subj := activity.Activity{}
			json.Unmarshal(resp.Body.Bytes(), &subj)

			assert.Equal(t, now.Unix(), subj.Start.Unix())
		})

		t.Run("end", func(t *testing.T) {
			tags, _ := json.Marshal(act.Tags)
			now := time.Now().UTC()
			end := now.Add(1 * time.Hour)
			updateBdy := fmt.Sprintf(`{"name":"%s","start":"%s","end":"%s","tags":%s}`, "updated name", now.Format(dateFmt), end.Format(dateFmt), string(tags))
			resp := makeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

			assert.Equal(t, http.StatusOK, resp.Code)

			subj := activity.Activity{}
			json.Unmarshal(resp.Body.Bytes(), &subj)

			assert.Equal(t, end.Unix(), subj.End.Unix())
		})

		t.Run("tags", func(t *testing.T) {
			tags := []string{"newTag1"}
			tagsJson, _ := json.Marshal(tags)
			now := time.Now().UTC()
			end := now.Add(1 * time.Hour)
			updateBdy := fmt.Sprintf(`{"name":"%s","start":"%s","end":"%s","tags":%s}`, "updated name", now.Format(dateFmt), end.Format(dateFmt), string(tagsJson))
			resp := makeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

			assert.Equal(t, http.StatusOK, resp.Code)

			subj := activity.Activity{}
			json.Unmarshal(resp.Body.Bytes(), &subj)

			assert.Equal(t, tags, subj.Tags)
		})

	})

	t.Run("should not update", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		makeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)
		actResp := makeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")
		act := activity.Activity{}
		json.Unmarshal(actResp.Body.Bytes(), &act)

		t.Run("with malformed json", func(t *testing.T) {
			updateBdy := "[malformedjson"
			resp := makeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

			assert.Equal(t, http.StatusBadRequest, resp.Code)
		})

		t.Run("for wrong id", func(t *testing.T) {
			updateBdy := fmt.Sprintf(`{"name":"%s"}`, "updated name")
			resp := makeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/not-existing-id", updateBdy)

			assert.Equal(t, http.StatusNotFound, resp.Code)
		})
	})
}

func makeAuthenticatedRequest(h http.HandlerFunc, userId, method, path, body string) *httptest.ResponseRecorder {
	return makeAuthenticatedRequestWithPattern(h, "", userId, method, path, body)
}
func makeAuthenticatedRequestWithPattern(h http.HandlerFunc, pattern, userId, method, path, body string) *httptest.ResponseRecorder {
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

	if pattern == "" {
		JWT().Handler(h).ServeHTTP(resp, req)
	} else {
		r := mux.NewRouter()
		r.Handle(pattern, JWT().Handler(h)).Methods(method)
		r.ServeHTTP(resp, req)
	}

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
