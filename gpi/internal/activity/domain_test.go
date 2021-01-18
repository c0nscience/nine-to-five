package activity_test

import (
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

func Test_Activity(t *testing.T) {

	t.Run("New", func(t *testing.T) {
		clock.SetTime(4200)
		now := clock.Now()
		subj := activity.New("userid", "new activity", []string{"tag1", "tag2"})

		t.Run("should have a name", func(t *testing.T) {
			assert.Equal(t, "new activity", subj.Name)
		})

		t.Run("should hold a userid", func(t *testing.T) {
			assert.Equal(t, "userid", subj.UserId)
		})

		t.Run("should hold tags", func(t *testing.T) {
			assert.Equal(t, []string{"tag1", "tag2"}, subj.Tags)
		})

		t.Run("should have a start set", func(t *testing.T) {
			assert.Equal(t, now.Unix(), subj.Start.Unix())
		})

		t.Run("should have time in UTC", func(t *testing.T) {
			assert.Equal(t, time.UTC, subj.Start.Location())
		})
	})

	t.Run("NewWithStart", func(t *testing.T) {
		t.Run("should have a start set", func(t *testing.T) {
			clock.SetTime(300)
			now := clock.Now()
			subj := activity.NewWithStart("userid", "new activity", now, []string{})
			assert.Equal(t, now.Unix(), subj.Start.Unix())
		})

		t.Run("should have a start adjusted to nearest 5th", func(t *testing.T) {
			subj := activity.NewWithStart("userid", "new activity", time.Date(2021, 1, 10, 10, 3, 0, 0, time.UTC), []string{})
			assert.Equal(t, time.Date(2021, 1, 10, 10, 5, 0, 0, time.UTC).Unix(), subj.Start.Unix())
		})
	})

	t.Run("Stop", func(t *testing.T) {
		t.Run("should set the end time", func(t *testing.T) {
			clock.SetTime(300)
			a := activity.New("userId", "new activity", []string{})

			assert.NotEqual(t, clock.Now().Unix(), a.End.Unix())
			clock.SetTime(600)
			a.Stop()
			assert.Equal(t, clock.Now().Unix(), a.End.Unix())

			t.Run("in UTC", func(t *testing.T) {
				assert.Equal(t, time.UTC, a.End.Location())
			})
		})

	})
}
