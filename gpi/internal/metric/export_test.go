package metric

import "time"

func AdjustToStartOfWeek(t time.Time) time.Time {
	return adjustToStartOfWeek(t)
}

func Date(t time.Time) time.Time {
	return date(t)
}
