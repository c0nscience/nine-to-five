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
				return day(1)
			},
			func(ctx context.Context, userId string, act activity.Activity) {
				_, _ = activityStore.Save(ctx, userId, &act)
			})

		resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Calculate(metricStore, activityStore), "/metrics/{id}", userId, "GET", "/metrics/"+metricId.Hex(), "")

		subj := metric.Result{}
		_ = json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, http.StatusOK, resp.Code)
		assert.Equal(t, "40h week", subj.Name)
		assert.Equal(t, 10*time.Hour, subj.TotalExceedingDuration)
		assert.Equal(t, "limited-sum", subj.Formula)
		assert.Equal(t, float64(40), subj.Threshold)
		assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(1)}, subj.Values[0])
		assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(8)}, subj.Values[1])
		assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(15)}, subj.Values[2])
		assert.Equal(t, metric.Value{Duration: 42*time.Hour + 30*time.Minute, Date: day(22)}, subj.Values[3])
	})

	t.Run("should return different week number for tasks on sunday and monday", func(t *testing.T) {
		ctx, clc := context.WithTimeout(context.Background(), timeout)
		t.Cleanup(func() {
			metricStore.DeleteAll(ctx, userId)
			activityStore.DeleteAll(ctx, userId)
			clc()
		})
		mId, _ := metricStore.Save(ctx, userId, metric.Configuration{
			UserId:    userId,
			Name:      "40h week",
			Tags:      []string{"tag1", "tag2"},
			Formula:   "limited-sum",
			Threshold: 40,
		})
		end1 := dateTime(time.July, 4, 16, 0)
		_, _ = activityStore.Save(ctx, userId, &activity.Activity{
			UserId: userId,
			Name:   "sun",
			Start:  dateTime(time.July, 4, 8, 0),
			End:    &end1,
			Tags:   []string{"tag1", "tag2"},
		})
		end2 := dateTime(time.July, 5, 16, 0)
		_, _ = activityStore.Save(ctx, userId, &activity.Activity{
			UserId: userId,
			Name:   "sun",
			Start:  dateTime(time.July, 5, 8, 0),
			End:    &end2,
			Tags:   []string{"tag1", "tag2"},
		})

		metricId := mId.(primitive.ObjectID)

		resp := jwttest.MakeAuthenticatedRequestWithPattern(metric.Calculate(metricStore, activityStore), "/metrics/{id}", userId, "GET", "/metrics/"+metricId.Hex(), "")

		subj := metric.Result{}
		_ = json.Unmarshal(resp.Body.Bytes(), &subj)

		assert.Equal(t, http.StatusOK, resp.Code)
		assert.Len(t, subj.Values, 2)
		assert.Equal(t, metric.Value{Duration: 8 * time.Hour, Date: monthDay(time.June, 28)}, subj.Values[0])
		assert.Equal(t, metric.Value{Duration: 8 * time.Hour, Date: monthDay(time.July, 5)}, subj.Values[1])
	})
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
