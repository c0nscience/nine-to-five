package metric

import (
	"encoding/json"
	"errors"
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"net/http"
	"sort"
	"time"
)

const (
	pathVariableId = "id"

	contextUserIdKey = "userId"
)

func Calculate(metricStore, activityStore store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, ok := r.Context().Value(contextUserIdKey).(string)
		if !ok {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)

		var config Configuration
		err := metricStore.FindOne(r.Context(), userId, byId(userId, vars[pathVariableId]), &config)
		if err != nil {
			log.Err(err).Msg("Could not find metric configuration")
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
		var activities []activity.Activity
		err = activityStore.Find(r.Context(), userId, byTags(userId, config.Tags), by("start", 1), &activities)
		if err != nil {
			log.Err(err).Msg("Could not find activities")
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		activitiesByWeek := map[time.Time][]activity.Activity{}
		for _, act := range activities {
			week := adjustToStartOfWeek(date(act.Start))
			a, ok := activitiesByWeek[week]
			if !ok {
				activitiesByWeek[week] = []activity.Activity{act}
				continue
			}
			a = append(a, act)
			activitiesByWeek[week] = a
		}

		values := []Value{}
		totalExceedingDuration := time.Duration(0)
		for week, activities := range activitiesByWeek {
			dur := time.Duration(0)
			for _, act := range activities {
				dur = dur + act.Duration()
			}
			values = append(values, Value{
				Date:     week,
				Duration: dur,
			})
			exceedingDuration := dur - time.Duration(config.Threshold)*time.Hour
			totalExceedingDuration += exceedingDuration
		}

		sort.Sort(ByDate(values))

		result := &Result{
			Id:                     config.Id.Hex(),
			Name:                   config.Name,
			TotalExceedingDuration: totalExceedingDuration,
			Formula:                config.Formula,
			Threshold:              config.Threshold,
			Values:                 values,
		}

		err = jsonResponse(w, http.StatusOK, result)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}

func byId(userId, id string) bson.M {
	objectID, _ := primitive.ObjectIDFromHex(id)
	return bson.M{"userId": userId, "_id": objectID}
}

func byTags(userId string, tags []string) bson.M {
	return bson.M{"userId": userId, "tags": bson.M{"$all": tags}}
}

func by(field string, order int) bson.D {
	return bson.D{{field, order}}
}

func adjustToStartOfWeek(t time.Time) time.Time {
	weekday := t.Weekday()
	offset := int(time.Monday) - int(weekday)
	if weekday == time.Sunday {
		offset = -6
	}
	return t.AddDate(0, 0, offset)
}

func date(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

func jsonResponse(w http.ResponseWriter, status int, a interface{}) error {
	b, err := json.Marshal(a)
	if err != nil {
		return errors.New("wrong data format")
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(b)
	return nil
}
