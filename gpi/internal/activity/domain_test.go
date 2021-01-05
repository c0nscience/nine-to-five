package activity_test

import (
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/stretchr/testify/assert"
	"testing"
)

func Test_Activity(t *testing.T) {
	t.Run("should hold a name", func(t *testing.T) {
		subj := activity.Activity{Name: "new activity"}

		assert.Equal(t, "new activity", subj.Name)
	})
}
