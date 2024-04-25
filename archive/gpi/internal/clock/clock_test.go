package clock_test

import (
	"fmt"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

func TestAdjustableTime_Adjust(t *testing.T) {
	tests := []struct {
		v, exp int
	}{
		{v: 3, exp: 5},
		{v: 2, exp: 0},
		{v: 6, exp: 5},
		{v: 13, exp: 15},
		{v: 16, exp: 15},
		{v: 22, exp: 20},
		{v: 23, exp: 25},
		{v: 26, exp: 25},
		{v: 33, exp: 35},
		{v: 45, exp: 45},
	}
	for _, test := range tests {
		t.Run(fmt.Sprintf("%d rounded to %d", test.v, test.exp), func(t *testing.T) {
			date := clock.Adjust(time.Date(2021, 1, 10, 10, test.v, 0, 0, time.UTC))
			assert.Equal(t, test.exp, date.Minute())
		})
	}

	t.Run("should truncate the time to minutes", func(t *testing.T) {
		date := clock.Adjust(time.Date(2021, 1, 10, 10, 3, 42, 210, time.UTC))
		assert.Equal(t, 5, date.Minute())
		assert.Equal(t, 0, date.Second())
		assert.Equal(t, 0, date.Nanosecond())
	})
}

func Benchmark(b *testing.B) {
	b.Run("normal time creation", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			time.Date(2021, 1, 10, 10, 3, 0, 0, time.UTC)
		}
	})

	b.Run("adjust time after creation", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			clock.Adjust(time.Date(2021, 1, 10, 10, 3, 0, 0, time.UTC))
		}
	})
}
