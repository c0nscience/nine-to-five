package clock

import "time"

var timeFn func() time.Time = nil

func SetTime(i int64) {
	timeFn = func() time.Time {
		return time.Unix(i, 0)
	}
}

func Now() time.Time {
	if timeFn == nil {
		return time.Now()
	}

	return timeFn()
}

var roundingThreshold = 5

func Adjust(t time.Time) time.Time {
	min := t.Minute()
	remainder := min % roundingThreshold
	var adjustBy int
	if remainder < 3 {
		adjustBy = remainder * -1
	} else {
		adjustBy = roundingThreshold - remainder
	}
	return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), min+adjustBy, 0, 0, t.Location())
}
