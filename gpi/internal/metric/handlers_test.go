package metric_test

import (
	"context"
	"encoding/json"
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwttest"
	"github.com/c0nscience/nine-to-five/gpi/internal/metric"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
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

func TestCalculate(t *testing.T) {
	metricStore := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), metric.Collection)
	activityStore := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), activity.Collection)
	userId := "userid"

	t.Run("should return exceeding duration for limited sum formula", func(t *testing.T) {
		ctx, clc := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			metricStore.DeleteAll(ctx, userId)
			activityStore.DeleteAll(ctx, userId)
			clc()
		})

		//duration, _ := time.ParseDuration("40h")
		mId, _ := metricStore.Save(ctx, userId, metric.Configuration{
			UserId: userId,
			Name:   "40h week",
			Tags:   []string{"tag1", "tag2"},
			//TimeUnit:  duration,
			Formula:   "limited-sum",
			Threshold: 40,
		})
		metricId := mId.(primitive.ObjectID)

		activity.CreateAll(ctx, userId, 4, 30, time.Minute, []string{"tag1", "tag2"},
			func() time.Time {
				return date(1)
			},
			func(ctx context.Context, userId string, act activity.Activity) {
				_, _ = activityStore.Save(ctx, userId, &act)
			})

		resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Calculate(metricStore, activityStore), "/metrics/{id}", userId, "GET", "/metrics/"+metricId.Hex(), "")

		subj := metric.Result{}
		log.Info().Msgf("%s", string(resp.Body.Bytes()))
		_ = json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, http.StatusOK, resp.Code)
		assert.Equal(t, "40h week", subj.Name)
		assert.Equal(t, 10*time.Hour, subj.TotalExceedingDuration)
		assert.Equal(t, "limited-sum", subj.Formula)
		assert.Equal(t, float64(40), subj.Threshold)
		assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: date(1)}, subj.Values[0])
		assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: date(8)}, subj.Values[1])
		assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: date(15)}, subj.Values[2])
		assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: date(22)}, subj.Values[3])
	})
}

func date(date int) time.Time {
	return dateTime(date, 0, 0)
}

func dateTime(date, h, m int) time.Time {
	return time.Date(2021, time.March, date, h, m, 0, 0, time.UTC)
}

func Test_AdjustToStartOfWeek(t *testing.T) {
	// given
	tm := date(4)

	// when
	subj := metric.AdjustToStartOfWeek(tm)

	// then
	assert.Equal(t, date(1), subj)
}

func Test_Date(t *testing.T) {
	// given
	d := time.Date(2021, time.May, 11, 9, 34, 42, 0, time.UTC)

	// when
	subj := metric.Date(d)

	// then
	assert.Equal(t, time.Date(2021, time.May, 11, 0, 0, 0, 0, time.UTC), subj)
}
