package metric

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/c0nscience/nine-to-five/gpi/internal/activity"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"io/ioutil"
	"net/http"
	"sort"
	"time"
)

const (
	pathVariableId = "id"

	contextUserIdKey = "userId"
)

const timeout = 200 * time.Millisecond

func Calculate(metricStore, activityStore store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, ok := r.Context().Value(contextUserIdKey).(string)
		if !ok {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)

		ctx, _ := context.WithTimeout(r.Context(), timeout)
		var config Configuration
		err := metricStore.FindOne(ctx, userId, byId(userId, vars[pathVariableId]), &config)
		if err != nil {
			log.Err(err).Msg("Could not find metric configuration")
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
		var activities []activity.Activity
		if len(config.Tags) == 0 {
			err = activityStore.Find(ctx, userId, byUser(userId), by("start", 1), &activities)
		} else {
			err = activityStore.Find(ctx, userId, byTags(userId, config.Tags), by("start", 1), &activities)
		}
		if err != nil {
			log.Err(err).Msg("Could not find activities")
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		activitiesByWeek := map[time.Time][]activity.Activity{}
		for _, act := range activities {
			week := AdjustToStartOfWeek(date(act.Start))
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
		currentExceedingDuration := time.Duration(0)
		currentWeek := AdjustToStartOfWeek(date(clock.Now()))
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
			if week != currentWeek {
				currentExceedingDuration += exceedingDuration
			}
		}

		sort.Sort(ByDate(values))

		result := &Result{
			Id:                       config.Id.Hex(),
			Name:                     config.Name,
			TotalExceedingDuration:   totalExceedingDuration,
			CurrentExceedingDuration: currentExceedingDuration,
			Threshold:                config.Threshold,
			Values:                   values,
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

func byUser(userId string) bson.M {
	return bson.M{"userId": userId}
}

func byTags(userId string, tags []string) bson.M {
	return bson.M{"userId": userId, "tags": bson.M{"$all": tags}}
}

func by(field string, order int) bson.D {
	return bson.D{{field, order}}
}

func AdjustToStartOfWeek(t time.Time) time.Time {
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

func List(metricStore store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, ok := r.Context().Value(contextUserIdKey).(string)
		if !ok {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		ctx, _ := context.WithTimeout(r.Context(), timeout)

		cfgs := []Configuration{}
		err := metricStore.Find(ctx, userId, byUser(userId), by("name", 1), &cfgs)
		if err != nil {
			log.Err(err).Msg("Could not find metric configurations")
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		res := make([]map[string]string, len(cfgs))
		for i, cfg := range cfgs {
			res[i] = map[string]string{
				"id":   cfg.Id.Hex(),
				"name": cfg.Name,
			}
		}

		err = jsonResponse(w, http.StatusOK, res)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}

type cfgForm struct {
	Name      string   `json:"name"`
	Threshold float64  `json:"threshold"`
	Tags      []string `json:"tags"`
}

func Create(metricStore store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, ok := r.Context().Value(contextUserIdKey).(string)
		if !ok {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		ctx, _ := context.WithTimeout(r.Context(), timeout)

		b, _ := ioutil.ReadAll(r.Body)

		bdy := cfgForm{}
		err := json.Unmarshal(b, &bdy)
		defer r.Body.Close()
		if err != nil {
			http.Error(w, "Payload does not have correct format.", http.StatusBadRequest)
			return
		}

		if len(bdy.Name) == 0 {
			http.Error(w, "No name provided", http.StatusBadRequest)
			return
		}

		cfg := &Configuration{
			UserId:    userId,
			Name:      bdy.Name,
			Threshold: bdy.Threshold,
			Tags:      bdy.Tags,
		}
		_, err = metricStore.Save(ctx, userId, cfg)
		if err != nil {
			log.Err(err).Msg("Could not save metric configuration")
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
	}
}

func Delete(metricStore store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, ok := r.Context().Value(contextUserIdKey).(string)
		if !ok {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		ctx, _ := context.WithTimeout(r.Context(), timeout)

		vars := mux.Vars(r)
		err := metricStore.Delete(ctx, userId, byId(userId, vars[pathVariableId]), nil)
		if err != nil {
			log.Err(err).Msg("Could not delete metric configuration")
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

func Update(metricStore store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, ok := r.Context().Value(contextUserIdKey).(string)
		if !ok {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		ctx, _ := context.WithTimeout(r.Context(), timeout)

		vars := mux.Vars(r)
		cfg := &Configuration{}
		err := metricStore.FindOne(ctx, userId, byId(userId, vars[pathVariableId]), cfg)
		if err != nil {
			log.Err(err).Msg("Could not find metric configuration")
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		b, _ := ioutil.ReadAll(r.Body)

		bdy := cfgForm{}
		err = json.Unmarshal(b, &bdy)
		defer r.Body.Close()
		if err != nil {
			http.Error(w, "Payload does not have correct format.", http.StatusBadRequest)
			return
		}

		cfg.Name = bdy.Name
		cfg.Tags = bdy.Tags
		cfg.Threshold = bdy.Threshold

		_, err = metricStore.Save(ctx, userId, cfg)
		if err != nil {
			http.Error(w, "Configuration could not be updated", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
	}
}



func Load(metricStore store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, ok := r.Context().Value(contextUserIdKey).(string)
		if !ok {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		ctx, _ := context.WithTimeout(r.Context(), timeout)

		vars := mux.Vars(r)
		cfg := &Configuration{}
		err := metricStore.FindOne(ctx, userId, byId(userId, vars[pathVariableId]), cfg)
		if err != nil {
			log.Err(err).Msg("Could not find metric configuration")
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}

		err = jsonResponse(w, http.StatusOK, cfg)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}