package activity

import (
	"context"
	"fmt"
	"time"
)

func CreateAll(ctx context.Context, userId string, weeks int, dailyOvertime int, unit time.Duration, tags []string, nowFn func() time.Time, processFn func(ctx context.Context, userId string, act Activity) error) error {
	now := nowFn()
	days := 5
	hours := 6
	step := 2
	for week := 0; week < weeks; week++ {
		for day := 0; day < days; day++ {
			for hour := 0; hour <= hours; hour += step {
				overtime := unit * 0
				if hour == 6 {
					overtime = unit * time.Duration(dailyOvertime)
				}
				name := fmt.Sprintf("activity #%d%d%d", week, day, hour)
				start := now.AddDate(0, 0, day+7*week).Add(time.Hour * time.Duration(hour))
				end := start.Add(time.Hour * time.Duration(step)).Add(overtime)
				act := Activity{
					UserId: userId,
					Name:   name,
					Start:  start,
					End:    &end,
					Tags:   tags,
				}
				err := processFn(ctx, userId, act)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
}
