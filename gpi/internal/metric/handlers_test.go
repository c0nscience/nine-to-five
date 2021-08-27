package metric_test

import (
	"context"
	"encoding/json"
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwttest"
	"github.com/c0nscience/nine-to-five/gpi/internal/metric"
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

const timeout = 5 * time.Second

func Test_Metrics(t *testing.T) {
	metricStore, err := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), metric.Collection)
	assert.NoError(t, err)
	activityStore, err := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)
	assert.NoError(t, err)

	t.Run("Calculate", func(t *testing.T) {
		t.Run("should return exceeding duration for limited sum formula", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))

			mId, _ := metricStore.Save(ctx, userId, metric.Configuration{
				UserId:    userId,
				Name:      "40h week",
				Tags:      []string{"tag3", "tag4"},
				Threshold: 40,
			})
			metricId := mId.(primitive.ObjectID)

			err := activity.CreateAll(ctx, userId, 4, 30, time.Minute, []string{"tag3", "tag4"},
				func() time.Time {
					return day(1)
				},
				func(ctx context.Context, userId string, act activity.Activity) error {
					_, err := activityStore.Save(ctx, userId, &act)
					if err != nil {
						return err
					}
					return nil
				})
			assert.NoError(t, err)

			clock.SetTime(day(22).Unix())
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Calculate(metricStore, activityStore), "/metrics/{id}", userId, "GET", "/metrics/"+metricId.Hex(), "")

			subj := metric.Result{}
			err = json.Unmarshal(resp.Body.Bytes(), &subj)
			assert.NoError(t, err)

			assert.Len(t, subj.Values, 4)
			assert.Equal(t, http.StatusOK, resp.Code)
			assert.Equal(t, "40h week", subj.Name)
			assert.Equal(t, 10*time.Hour, subj.TotalExceedingDuration)
			assert.Equal(t, 7*time.Hour+30*time.Minute, subj.CurrentExceedingDuration)
			assert.Equal(t, float64(40), subj.Threshold)
			assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(1)}, subj.Values[0])
			assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(8)}, subj.Values[1])
			assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(15)}, subj.Values[2])
			assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(22)}, subj.Values[3])
		})

		t.Run("should return result over all saved activities", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))

			mId, _ := metricStore.Save(ctx, userId, metric.Configuration{
				UserId:    userId,
				Name:      "40h week",
				Tags:      []string{},
				Threshold: 40,
			})
			metricId := mId.(primitive.ObjectID)

			err := activity.CreateAll(ctx, userId, 2, 30, time.Minute, []string{"tag3", "tag4"},
				func() time.Time {
					return day(1)
				},
				func(ctx context.Context, userId string, act activity.Activity) error {
					_, err := activityStore.Save(ctx, userId, &act)
					if err != nil {
						return err
					}
					return nil
				})
			assert.NoError(t, err)

			err = activity.CreateAll(ctx, userId, 2, 30, time.Minute, []string{},
				func() time.Time {
					return day(15)
				},
				func(ctx context.Context, userId string, act activity.Activity) error {
					_, err := activityStore.Save(ctx, userId, &act)
					if err != nil {
						return err
					}
					return nil
				})
			assert.NoError(t, err)

			clock.SetTime(day(22).Unix())
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Calculate(metricStore, activityStore), "/metrics/{id}", userId, "GET", "/metrics/"+metricId.Hex(), "")

			subj := metric.Result{}
			err = json.Unmarshal(resp.Body.Bytes(), &subj)
			assert.NoError(t, err)

			assert.Len(t, subj.Values, 4)
			assert.Equal(t, http.StatusOK, resp.Code)
			assert.Equal(t, "40h week", subj.Name)
			assert.Equal(t, 10*time.Hour, subj.TotalExceedingDuration)
			assert.Equal(t, 7*time.Hour+30*time.Minute, subj.CurrentExceedingDuration)
			assert.Equal(t, float64(40), subj.Threshold)
			assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(1)}, subj.Values[0])
			assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(8)}, subj.Values[1])
			assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(15)}, subj.Values[2])
			assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(22)}, subj.Values[3])
		})

		t.Run("should return different week number for tasks on sunday and monday", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))
			mId, err := metricStore.Save(ctx, userId, metric.Configuration{
				UserId:    userId,
				Name:      "40h week",
				Tags:      []string{"tag1", "tag2"},
				Threshold: 40,
			})
			assert.NoError(t, err)

			end1 := dateTime(time.July, 4, 16, 0)
			_, err = activityStore.Save(ctx, userId, &activity.Activity{
				UserId: userId,
				Name:   "sun",
				Start:  dateTime(time.July, 4, 8, 0),
				End:    &end1,
				Tags:   []string{"tag1", "tag2"},
			})
			assert.NoError(t, err)
			end2 := dateTime(time.July, 5, 16, 0)
			_, err = activityStore.Save(ctx, userId, &activity.Activity{
				UserId: userId,
				Name:   "sun",
				Start:  dateTime(time.July, 5, 8, 0),
				End:    &end2,
				Tags:   []string{"tag1", "tag2"},
			})
			assert.NoError(t, err)

			metricId := mId.(primitive.ObjectID)

			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Calculate(metricStore, activityStore), "/metrics/{id}", userId, "GET", "/metrics/"+metricId.Hex(), "")

			subj := metric.Result{}
			_ = json.Unmarshal(resp.Body.Bytes(), &subj)

			assert.Equal(t, http.StatusOK, resp.Code)
			assert.Len(t, subj.Values, 2)
			assert.Equal(t, metric.Value{Duration: 8 * time.Hour, Date: monthDay(time.June, 28)}, subj.Values[0])
			assert.Equal(t, metric.Value{Duration: 8 * time.Hour, Date: monthDay(time.July, 5)}, subj.Values[1])
		})
	})

	t.Run("List", func(t *testing.T) {
		t.Run("should contain the saved metric configurations", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))
			mId1, err := metricStore.Save(ctx, userId, metric.Configuration{
				UserId:    userId,
				Name:      "metric config #1",
				Tags:      []string{"tag1", "tag2"},
				Threshold: 40,
			})
			assert.NoError(t, err)
			mId2, err := metricStore.Save(ctx, userId, metric.Configuration{
				UserId:    userId,
				Name:      "metric config #2",
				Tags:      []string{"tag1", "tag2"},
				Threshold: 40,
			})
			assert.NoError(t, err)

			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.List(metricStore), "/metrics", userId, "GET", "/metrics", "")

			subj := []map[string]string{}
			err = json.Unmarshal(resp.Body.Bytes(), &subj)
			assert.NoError(t, err)

			assert.Len(t, subj, 2)
			assert.Equal(t, http.StatusOK, resp.Code)
			assert.Equal(t, "metric config #1", subj[0]["name"])
			assert.Equal(t, mId1.(primitive.ObjectID).Hex(), subj[0]["id"])
			assert.Equal(t, "metric config #2", subj[1]["name"])
			assert.Equal(t, mId2.(primitive.ObjectID).Hex(), subj[1]["id"])
		})

		t.Run("should return empty list in case no metrics are saved", func(t *testing.T) {
			userId := uuid.New().String()
			t.Cleanup(stores(metricStore, activityStore, userId))

			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.List(metricStore), "/metrics", userId, "GET", "/metrics", "")

			subj := []map[string]string{}
			err = json.Unmarshal(resp.Body.Bytes(), &subj)
			assert.NoError(t, err)

			assert.Len(t, subj, 0)
			assert.Equal(t, http.StatusOK, resp.Code)
		})
	})

	t.Run("Create", func(t *testing.T) {
		t.Run("should create metric with name", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))

			createBody := "{\"name\":\"metric cfg #1\"}"
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Create(metricStore), "/metrics", userId, "POST", "/metrics", createBody)

			assert.Equal(t, http.StatusCreated, resp.Code)

			cfgs := []metric.Configuration{}
			err := metricStore.Find(ctx, userId, bson.M{"userId": userId}, bson.D{{"name", 1}}, &cfgs)
			assert.NoError(t, err)

			assert.Len(t, cfgs, 1)
			assert.Equal(t, "metric cfg #1", cfgs[0].Name)
		})

		t.Run("should create metric with name and threshold", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))

			createBody := "{\"name\":\"metric cfg #2\",\"threshold\":35.2}"
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Create(metricStore), "/metrics", userId, "POST", "/metrics", createBody)

			assert.Equal(t, http.StatusCreated, resp.Code)

			cfgs := []metric.Configuration{}
			err := metricStore.Find(ctx, userId, bson.M{"userId": userId}, bson.D{{"name", 1}}, &cfgs)
			assert.NoError(t, err)

			assert.Len(t, cfgs, 1)
			assert.Equal(t, "metric cfg #2", cfgs[0].Name)
			assert.Equal(t, 35.2, cfgs[0].Threshold)
		})

		t.Run("should create metric with name and tags", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))

			createBody := "{\"name\":\"metric cfg #3\",\"tags\":[\"tag-1\",\"tag-2\"]}"
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Create(metricStore), "/metrics", userId, "POST", "/metrics", createBody)

			assert.Equal(t, http.StatusCreated, resp.Code)

			cfgs := []metric.Configuration{}
			err := metricStore.Find(ctx, userId, bson.M{"userId": userId}, bson.D{{"name", 1}}, &cfgs)
			assert.NoError(t, err)

			assert.Len(t, cfgs, 1)
			assert.Equal(t, "metric cfg #3", cfgs[0].Name)
			assert.Equal(t, []string{"tag-1", "tag-2"}, cfgs[0].Tags)
		})

		t.Run("should fail with no name", func(t *testing.T) {
			userId := uuid.New().String()
			t.Cleanup(stores(metricStore, activityStore, userId))

			createBody := "{\"name\":\"\"}"
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Create(metricStore), "/metrics", userId, "POST", "/metrics", createBody)

			assert.Equal(t, http.StatusBadRequest, resp.Code)

			createBody = "{}"
			resp = jwttest.MakeAuthenticatedRequestWithPattern(metric.Create(metricStore), "/metrics", userId, "POST", "/metrics", createBody)

			assert.Equal(t, http.StatusBadRequest, resp.Code)
		})
	})

	t.Run("Delete", func(t *testing.T) {
		t.Run("should delete metric", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))

			mId, err := metricStore.Save(ctx, userId, metric.Configuration{
				UserId:    userId,
				Name:      "40h week",
				Tags:      []string{"tag1", "tag2"},
				Threshold: 40,
			})
			assert.NoError(t, err)

			cfgs := []metric.Configuration{}
			err = metricStore.Find(ctx, userId, bson.M{"userId": userId}, bson.D{{"name", 1}}, &cfgs)
			assert.NoError(t, err)

			assert.Len(t, cfgs, 1)

			metricId := mId.(primitive.ObjectID)
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Delete(metricStore), "/metrics/{id}", userId, "DELETE", "/metrics/"+metricId.Hex(), "")

			assert.Equal(t, http.StatusOK, resp.Code)

			cfgs = []metric.Configuration{}
			err = metricStore.Find(ctx, userId, bson.M{"userId": userId}, bson.D{{"name", 1}}, &cfgs)
			assert.NoError(t, err)

			assert.Len(t, cfgs, 0)
		})
	})

	t.Run("Update", func(t *testing.T) {
		t.Run("should update metric", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))

			mId, err := metricStore.Save(ctx, userId, metric.Configuration{
				UserId:    userId,
				Name:      "40h week",
				Tags:      []string{"tag1", "tag2"},
				Threshold: 40,
			})
			assert.NoError(t, err)

			updateBody := "{\"name\":\"metric cfg #1\",\"threshold\":35.2,\"tags\":[\"tag3\"]}"
			metricId := mId.(primitive.ObjectID)
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Update(metricStore), "/metrics/{id}", userId, "POST", "/metrics/"+metricId.Hex(), updateBody)

			assert.Equal(t, http.StatusOK, resp.Code)

			cfg := metric.Configuration{}
			err = metricStore.FindOne(ctx, userId, bson.M{"userId": userId, "_id": mId}, &cfg)
			assert.NoError(t, err)

			assert.Equal(t, "metric cfg #1", cfg.Name)
			assert.Equal(t, 35.2, cfg.Threshold)
			assert.Equal(t, []string{"tag3"}, cfg.Tags)
		})

		t.Run("should update metric and set threshold to 0", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))

			mId, err := metricStore.Save(ctx, userId, metric.Configuration{
				UserId:    userId,
				Name:      "40h week",
				Tags:      []string{"tag1", "tag2"},
				Threshold: 40,
			})
			assert.NoError(t, err)

			updateBody := "{\"name\":\"metric cfg #1\",\"threshold\":0,\"tags\":[\"tag3\"]}"
			metricId := mId.(primitive.ObjectID)
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Update(metricStore), "/metrics/{id}", userId, "POST", "/metrics/"+metricId.Hex(), updateBody)

			assert.Equal(t, http.StatusOK, resp.Code)

			cfg := metric.Configuration{}
			err = metricStore.FindOne(ctx, userId, bson.M{"userId": userId, "_id": mId}, &cfg)
			assert.NoError(t, err)

			assert.Equal(t, "metric cfg #1", cfg.Name)
			assert.Equal(t, float64(0), cfg.Threshold)
			assert.Equal(t, []string{"tag3"}, cfg.Tags)
		})
	})

	t.Run("Load", func(t *testing.T) {
		t.Run("should load metric", func(t *testing.T) {
			userId := uuid.New().String()
			ctx, _ := context.WithTimeout(context.Background(), timeout)
			t.Cleanup(stores(metricStore, activityStore, userId))

			mId, err := metricStore.Save(ctx, userId, metric.Configuration{
				UserId:    userId,
				Name:      "40h week",
				Tags:      []string{"tag1", "tag2"},
				Threshold: 40,
			})
			assert.NoError(t, err)

			metricId := mId.(primitive.ObjectID)
			resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Load(metricStore), "/metrics/{id}/config", userId, "GET", "/metrics/"+metricId.Hex()+"/config", "")

			subj := metric.Configuration{}
			_ = json.Unmarshal(resp.Body.Bytes(), &subj)
			assert.Equal(t, http.StatusOK, resp.Code)
			assert.Equal(t, "40h week", subj.Name)
			assert.Equal(t, []string{"tag1", "tag2"}, subj.Tags)
			assert.Equal(t, 40.0, subj.Threshold)
		})
	})
}

func stores(metricStore store.Store, activityStore store.Store, userId string) func() {
	return func() {
		ctx := context.Background()
		metricStore.DeleteAll(ctx, userId)
		activityStore.DeleteAll(ctx, userId)
	}
}

func day(day int) time.Time {
	return dateTime(time.March, day, 0, 0)
}

func monthDay(month time.Month, day int) time.Time {
	return dateTime(month, day, 0, 0)

}

func dateTime(month time.Month, day, h, m int) time.Time {
	return time.Date(2021, month, day, h, m, 0, 0, time.UTC)
}

func Test_AdjustToStartOfWeek(t *testing.T) {
	t.Run("should truncate the date to start of the week", func(t *testing.T) {
		// given
		tm := day(4)

		// when
		subj := metric.AdjustToStartOfWeek(tm)

		// then
		assert.Equal(t, day(1), subj)

	})

	t.Run("should calculate correct week for sundays", func(t *testing.T) {
		// given
		tm := monthDay(time.July, 4)

		// when
		subj := metric.AdjustToStartOfWeek(tm)

		// then
		assert.Equal(t, monthDay(time.June, 28), subj)

	})
}

func Test_Date(t *testing.T) {
	// given
	d := time.Date(2021, time.May, 11, 9, 34, 42, 0, time.UTC)

	// when
	subj := metric.Date(d)

	// then
	assert.Equal(t, time.Date(2021, time.May, 11, 0, 0, 0, 0, time.UTC), subj)
}
