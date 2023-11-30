package activity

import (
	"encoding/json"
	"errors"
	"github.com/c0nscience/nine-to-five/gpi/internal/jwt"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"io"
	"net/http"
	"time"
)

const (
	pathVariableId = "id"
	pathFromDate   = "from"
	pathToDate     = "to"
)

func Start(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := jwt.UserId(r.Context())
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		if err := store.FindOne(r.Context(), userId, runningBy(userId), nil); !errors.Is(err, mongo.ErrNoDocuments) {
			http.Error(w, "Activity already running", http.StatusBadRequest)
			return
		}

		bdy := startActivity{}
		b, _ := io.ReadAll(r.Body)
		err = json.Unmarshal(b, &bdy)
		defer r.Body.Close()
		if err != nil {
			http.Error(w, "Payload does not have correct format.", http.StatusBadRequest)
			return
		}

		var a *Activity
		if bdy.Start == nil {
			a = New(userId, bdy.Name, bdy.Tags)
		} else {
			a = NewWithStart(userId, bdy.Name, *bdy.Start, bdy.Tags)
		}

		id, err := store.Save(r.Context(), userId, a)

		if err != nil {
			http.Error(w, "Activity could not be started", http.StatusInternalServerError)
			return
		}

		a.Id = id.(primitive.ObjectID)

		err = jsonResponse(w, http.StatusCreated, a)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
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

type startActivity struct {
	Name  string     `json:"name"`
	Start *time.Time `json:"start"`
	Tags  []string   `json:"tags"`
}

func Stop(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := jwt.UserId(r.Context())
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		var running Activity
		err = store.FindOne(r.Context(), userId, runningBy(userId), &running)
		if err != nil {
			http.Error(w, "No activity stopped", http.StatusOK)
			return
		}

		(&running).Stop()

		_, err = store.Save(r.Context(), userId, &running)
		if err != nil {
			http.Error(w, "Running activity could not be stopped", http.StatusInternalServerError)
			return
		}

		err = jsonResponse(w, http.StatusOK, running)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}

func Running(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := jwt.UserId(r.Context())
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		var running Activity
		err = store.FindOne(r.Context(), userId, runningBy(userId), &running)
		if err != nil {
			http.Error(w, "No running activity found", http.StatusNotFound)
			return
		}

		err = jsonResponse(w, http.StatusOK, running)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}

func Get(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := jwt.UserId(r.Context())
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)

		var activity Activity
		err = store.FindOne(r.Context(), userId, byId(userId, vars[pathVariableId]), &activity)
		if err != nil {
			http.Error(w, "Activity not found", http.StatusNotFound)
			return
		}

		err = jsonResponse(w, http.StatusOK, activity)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}

func Update(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := jwt.UserId(r.Context())
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)

		b, err := io.ReadAll(r.Body)
		defer r.Body.Close()
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		uptAct := updateActivity{}
		err = json.Unmarshal(b, &uptAct)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		svdAct := Activity{}
		err = store.FindOne(r.Context(), userId, byId(userId, vars[pathVariableId]), &svdAct)
		if err != nil {
			http.Error(w, "Activity not found", http.StatusNotFound)
			return
		}

		svdAct.Name = uptAct.Name
		svdAct.Start = uptAct.Start
		svdAct.End = uptAct.End
		svdAct.Tags = uptAct.Tags

		_, err = store.Save(r.Context(), userId, &svdAct)
		if err != nil {
			http.Error(w, "Could not update activity", http.StatusInternalServerError)
			return
		}

		err = jsonResponse(w, http.StatusOK, &svdAct)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}

func Delete(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := jwt.UserId(r.Context())
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)

		var deletedAct Activity
		err = store.Delete(r.Context(), userId, byId(userId, vars[pathVariableId]), &deletedAct)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				http.NotFound(w, r)
				return
			}
			http.Error(w, "Could not delete activity", http.StatusInternalServerError)
			return
		}

		err = jsonResponse(w, http.StatusOK, &deletedActivity{
			Id:    deletedAct.Id.Hex(),
			Start: deletedAct.Start,
		})
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}

func Tags(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := jwt.UserId(r.Context())
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		tags, err := store.Distinct(r.Context(), userId, "tags")
		if err != nil {
			http.Error(w, "Could not find tags", http.StatusInternalServerError)
			return
		}

		err = jsonResponse(w, http.StatusOK, &tags)
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}

const pathDateLayout = "2006-01-02"

func InRange(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := jwt.UserId(r.Context())
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)

		fromDate, err := time.Parse(pathDateLayout, vars[pathFromDate])
		if err != nil {
			http.Error(w, "Could not read from date.", http.StatusBadRequest)
			return
		}
		toDate, err := time.Parse(pathDateLayout, vars[pathToDate])
		if err != nil {
			http.Error(w, "Could not read to date.", http.StatusBadRequest)
			return
		}

		res := []Activity{}
		err = store.Find(r.Context(), userId, byStartBetween(userId, fromDate, toDate), by("start", 1), &res)
		if err != nil {
			if errors.Is(err, mongo.ErrNoDocuments) {
				http.Error(w, "Could not find any data in range", http.StatusNotFound)
				return
			}
			http.Error(w, "An error occurred during searching activities in the range", http.StatusInternalServerError)
			return
		}

		err = jsonResponse(w, http.StatusOK, &inRangeActivities{Entries: res})
		if err != nil {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
}

type inRangeActivities struct {
	Entries []Activity `json:"entries"`
}

type deletedActivity struct {
	Id    string    `json:"id"`
	Start time.Time `json:"start"`
}

type updateActivity struct {
	Name  string     `json:"name"`
	Start time.Time  `json:"start"`
	End   *time.Time `json:"end"`
	Tags  []string   `json:"tags"`
}

func runningBy(userId string) bson.M {
	return bson.M{"userId": userId, "end": nil}
}

func byId(userId, id string) bson.M {
	objectID, _ := primitive.ObjectIDFromHex(id)
	return bson.M{"userId": userId, "_id": objectID}
}

func by(field string, order int) bson.D {
	return bson.D{{Key: field, Value: order}}
}

func byStartBetween(userId string, from, to time.Time) bson.D {
	from = from.Truncate(24 * time.Hour)
	to = to.Add(24 * time.Hour).Truncate(24 * time.Hour)
	return bson.D{
		{Key: "userId", Value: userId},
		{Key: "start", Value: bson.M{"$gt": from, "$lt": to}},
	}
}

func Repeat(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := jwt.UserId(r.Context())
		if err != nil {
			http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
			return
		}

		bdy := repeatActivityWithConfig{}
		b, _ := io.ReadAll(r.Body)
		err = json.Unmarshal(b, &bdy)
		defer r.Body.Close()
		if err != nil {
			http.Error(w, "Payload does not have correct format.", http.StatusBadRequest)
			return
		}

		act := bdy.Activity
		config := bdy.Config
		start, err := time.Parse("15:04:05.000", act.Start)
		if err != nil {
			http.Error(w, "Payload does not have correct format. (Wrong date format for 'start')", http.StatusBadRequest)
			return
		}
		end, err := time.Parse("15:04:05.000", act.End)
		if err != nil {
			http.Error(w, "Payload does not have correct format. (Wrong date format for 'end')", http.StatusBadRequest)
			return
		}

		from, err := time.Parse("2006-01-02", config.From)
		if err != nil {
			http.Error(w, "Payload does not have correct format. (Wrong date format for 'from')", http.StatusBadRequest)
			return
		}

		to, err := time.Parse("2006-01-02", config.To)
		if err != nil {
			http.Error(w, "Payload does not have correct format. (Wrong date format for 'to')", http.StatusBadRequest)
			return
		}

		days := int(to.AddDate(0, 0, 1).Sub(from).Hours() / 24)

		for i := 0; i < days; i++ {
			d := from.AddDate(0, 0, i)
			for _, selectedDay := range config.SelectedDays {
				if d.Weekday() == selectedDay {
					start := time.Date(d.Year(), d.Month(), d.Day(), start.Hour(), start.Minute(), 0, 0, time.UTC)
					end := time.Date(d.Year(), d.Month(), d.Day(), end.Hour(), end.Minute(), 0, 0, time.UTC)
					_, _ = store.Save(r.Context(), userId, NewWithStartAndEnd(userId, act.Name, start, end, act.Tags))
					break
				}
			}
		}

		w.WriteHeader(http.StatusCreated)
	}
}

type repeatActivityWithConfig struct {
	Activity repeatActivity `json:"activity"`
	Config   repeatConfig   `json:"config"`
}

type repeatActivity struct {
	Name  string   `json:"name"`
	Tags  []string `json:"tags"`
	Start string   `json:"start"`
	End   string   `json:"end"`
}

type repeatConfig struct {
	From         string         `json:"from"`
	To           string         `json:"to"`
	SelectedDays []time.Weekday `json:"selectedDays"`
}
