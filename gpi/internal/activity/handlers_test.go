package activity_test

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwttest"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"net/http"
	"os"
	"testing"
	"time"
)

func init() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

const timeout = 200 * time.Millisecond

func Test_Start(t *testing.T) {
	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)

	userId := "userid"
	t.Run("should return started activity", func(t *testing.T) {
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)
		now := clock.Now()

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		resp := jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		subj := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, http.StatusCreated, resp.Code)
		assert.Equal(t, userId, subj.UserId)
		assert.Equal(t, "new activity", subj.Name)
		assert.Equal(t, now.Unix(), subj.Start.Unix())
		assert.Equal(t, []string{"tag1", "tag2"}, subj.Tags)

		var stored activity.Activity
		err := mongoDbCli.FindOne(ctx, userId, bson.M{"_id": subj.Id}, &stored)
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
		resp := jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		subj := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, http.StatusCreated, resp.Code)
		assert.Equal(t, userId, subj.UserId)
		assert.Equal(t, "new activity", subj.Name)
		assert.Equal(t, time.Date(2021, 1, 9, 10, 0, 0, 0, time.UTC).Unix(), subj.Start.Unix())
		assert.Equal(t, []string{"tag1", "tag2"}, subj.Tags)

		var stored activity.Activity
		err := mongoDbCli.FindOne(ctx, userId, bson.M{"_id": subj.Id}, &stored)
		assert.NoError(t, err)
		assert.NotNil(t, stored)
		assert.Equal(t, time.Date(2021, 1, 9, 10, 0, 0, 0, time.UTC).Unix(), stored.Start.Unix())
	})

	t.Run("should return bad request if another activity is already running", func(t *testing.T) {
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"new activity","start":"2021-01-09T10:00:00Z","tags":["tag1","tag2"]}`)
		resp := jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"new activity2","start":"2021-01-09T10:00:00Z","tags":["tag1","tag2"]}`)

		assert.Equal(t, http.StatusBadRequest, resp.Code)
	})
}

func Test_Stop(t *testing.T) {
	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)

	t.Run("should set the end date to the current date of the current running activity", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

		clock.SetTime(300)

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		clock.SetTime(600)
		now := clock.Now()
		resp := jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")

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

		resp := jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")
		assert.Equal(t, http.StatusOK, resp.Code)
	})
}

func Test_Running(t *testing.T) {
	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)

	t.Run("should return currently running activity", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		startResp := jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		startAct := activity.Activity{}
		json.Unmarshal(startResp.Body.Bytes(), &startAct)

		resp := jwttest.MakeAuthenticatedRequest(activity.Running(mongoDbCli), userId, "GET", "/activity/running", "")

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

		resp := jwttest.MakeAuthenticatedRequest(activity.Running(mongoDbCli), userId, "GET", "/activity/running", "")

		assert.Equal(t, http.StatusNotFound, resp.Code)
	})
}

func Test_Get(t *testing.T) {
	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)

	t.Run("should return activity by id", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		startResp := jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		startAct := activity.Activity{}
		json.Unmarshal(startResp.Body.Bytes(), &startAct)

		resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.Get(mongoDbCli), "/activities/{id}", userId, "GET", "/activities/"+startAct.Id.Hex(), "")

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

		resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.Get(mongoDbCli), "/activities/{id}", userId, "GET", "/activities/notexisting", "")

		assert.Equal(t, http.StatusNotFound, resp.Code)
	})
}

func Test_Update(t *testing.T) {
	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)
	const dateFmt = "2006-01-02T15:04:05Z"

	t.Run("should update", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)

		bdy := `{"name":"new activity","tags":["tag1","tag2"]}`
		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)
		actResp := jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")
		act := activity.Activity{}
		json.Unmarshal(actResp.Body.Bytes(), &act)

		t.Run("name", func(t *testing.T) {
			tags, _ := json.Marshal(act.Tags)
			updateBdy := fmt.Sprintf(`{"name":"%s","start":"%s","end":"%s","tags":%s}`, "updated name", act.Start.Format(dateFmt), act.End.Format(dateFmt), string(tags))
			resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

			assert.Equal(t, http.StatusOK, resp.Code)

			subj := activity.Activity{}
			json.Unmarshal(resp.Body.Bytes(), &subj)

			assert.Equal(t, "updated name", subj.Name)
		})

		t.Run("start", func(t *testing.T) {
			tags, _ := json.Marshal(act.Tags)
			now := time.Now().UTC()
			updateBdy := fmt.Sprintf(`{"name":"%s","start":"%s","end":"%s","tags":%s}`, "updated name", now.Format(dateFmt), act.End.Format(dateFmt), string(tags))
			resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

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
			resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

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
			resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

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
		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)
		actResp := jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")
		act := activity.Activity{}
		json.Unmarshal(actResp.Body.Bytes(), &act)

		t.Run("with malformed json", func(t *testing.T) {
			updateBdy := "[malformedjson"
			resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/"+act.Id.Hex(), updateBdy)

			assert.Equal(t, http.StatusBadRequest, resp.Code)
		})

		t.Run("for wrong id", func(t *testing.T) {
			updateBdy := fmt.Sprintf(`{"name":"%s"}`, "updated name")
			resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.Update(mongoDbCli), "/activity/{id}", userId, "POST", "/activity/not-existing-id", updateBdy)

			assert.Equal(t, http.StatusNotFound, resp.Code)
		})
	})
}

func Test_Delete(t *testing.T) {
	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)

	t.Run("should remove activity by id", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)

		bdy := `{"name":"activity to delete","tags":["tag1","tag2"]}`
		resp := jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", bdy)

		act := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &act)

		resp = jwttest.MakeAuthenticatedRequestWithPattern(activity.Delete(mongoDbCli), "/activity/{id}", userId, "DELETE", "/activity/"+act.Id.Hex(), "")

		delAct := activity.Activity{}
		json.Unmarshal(resp.Body.Bytes(), &delAct)

		assert.NotEqual(t, primitive.NilObjectID, delAct.Id)
		assert.Equal(t, act.Id, delAct.Id)
		assert.Equal(t, clock.Now().Unix(), act.Start.Unix())

		resp = jwttest.MakeAuthenticatedRequestWithPattern(activity.Get(mongoDbCli), "/activities/{id}", userId, "GET", "/activities/"+act.Id.Hex(), "")

		assert.Equal(t, http.StatusNotFound, resp.Code)
	})

	t.Run("should return not found if activity to be deleted does not exist", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)

		resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.Delete(mongoDbCli), "/activity/{id}", userId, "DELETE", "/activity/doesnotexist", "")
		assert.Equal(t, http.StatusNotFound, resp.Code)
	})
}

func Test_Tags(t *testing.T) {
	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)

	t.Run("should return used tags", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)

		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"new act 1","tags":["tag1"]}`)
		jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")
		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"new act 2","tags":["another-tag"]}`)
		jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")

		resp := jwttest.MakeAuthenticatedRequest(activity.Tags(mongoDbCli), userId, "GET", "/activities/tags", "")

		var tags []string
		json.Unmarshal(resp.Body.Bytes(), &tags)
		assert.Equal(t, []string{"another-tag", "tag1"}, tags)
	})

	t.Run("should return empty array if no tags where found", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})
		clock.SetTime(300)

		resp := jwttest.MakeAuthenticatedRequest(activity.Tags(mongoDbCli), userId, "GET", "/activities/tags", "")

		var tags []string
		json.Unmarshal(resp.Body.Bytes(), &tags)
		assert.Empty(t, tags)
		assert.Equal(t, http.StatusOK, resp.Code)
	})
}

func Test_InRange(t *testing.T) {
	mongoDbCli := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)

	t.Run("should return only activities in date range", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

		clock.SetTime(time.Date(2021, 1, 1, 10, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"activity 1","tags":["tag1","tag2"]}`)
		clock.SetTime(time.Date(2021, 1, 1, 11, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")

		clock.SetTime(time.Date(2021, 1, 1, 11, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"activity 2","tags":["tag1","tag2"]}`)
		clock.SetTime(time.Date(2021, 1, 1, 12, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")

		clock.SetTime(time.Date(2021, 1, 2, 10, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"activity 3","tags":["tag1","tag2"]}`)
		clock.SetTime(time.Date(2021, 1, 2, 11, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")

		path := fmt.Sprintf("/activities/%s/%s", "2021-01-01", "2021-01-01")
		resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.InRange(mongoDbCli), "/activities/{from}/{to}", userId, "GET", path, "")
		assert.Equal(t, http.StatusOK, resp.Code)

		res := struct {
			Entries []activity.Activity `json:"entries"`
		}{}
		json.Unmarshal(resp.Body.Bytes(), &res)

		assert.Len(t, res.Entries, 2)
		assert.Equal(t, "activity 1", res.Entries[0].Name)
		assert.Equal(t, "activity 2", res.Entries[1].Name)
	})

	t.Run("should return activities sorted ascending", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

		clock.SetTime(time.Date(2021, 1, 1, 13, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"activity afternoon","tags":["tag1","tag2"]}`)
		clock.SetTime(time.Date(2021, 1, 1, 14, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")

		clock.SetTime(time.Date(2021, 1, 1, 10, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Start(mongoDbCli), userId, "POST", "/activity", `{"name":"activity morning","tags":["tag1","tag2"]}`)
		clock.SetTime(time.Date(2021, 1, 1, 11, 0, 0, 0, time.UTC).Unix())
		jwttest.MakeAuthenticatedRequest(activity.Stop(mongoDbCli), userId, "POST", "/activity/stop", "")

		path := fmt.Sprintf("/activities/%s/%s", "2021-01-01", "2021-01-01")
		resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.InRange(mongoDbCli), "/activities/{from}/{to}", userId, "GET", path, "")
		assert.Equal(t, http.StatusOK, resp.Code)

		res := struct {
			Entries []activity.Activity `json:"entries"`
		}{}
		json.Unmarshal(resp.Body.Bytes(), &res)

		assert.Len(t, res.Entries, 2)
		assert.Equal(t, "activity morning", res.Entries[0].Name)
		assert.Equal(t, "activity afternoon", res.Entries[1].Name)
	})

	t.Run("should return bad request with malformed", func(t *testing.T) {
		userId := uuid.New().String()
		ctx, _ := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			mongoDbCli.DeleteAll(ctx, userId)
		})

		t.Run("from date", func(t *testing.T) {
			path := fmt.Sprintf("/activities/%s/%s", "wrong-from", "2021-01-01")
			resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.InRange(mongoDbCli), "/activities/{from}/{to}", userId, "GET", path, "")
			assert.Equal(t, http.StatusBadRequest, resp.Code)
		})

		t.Run("to date", func(t *testing.T) {
			path := fmt.Sprintf("/activities/%s/%s", "2021-01-01", "wrong-from")
			resp := jwttest.MakeAuthenticatedRequestWithPattern(activity.InRange(mongoDbCli), "/activities/{from}/{to}", userId, "GET", path, "")
			assert.Equal(t, http.StatusBadRequest, resp.Code)
		})
	})
}
