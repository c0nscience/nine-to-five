package activity

import (
	"encoding/json"
	"errors"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"io/ioutil"
	"net/http"
	"time"
)

const pathVariableId = "id"

func Start(store store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId, err := userId(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := store.Find(r.Context(), userId, runningBy(userId), nil); err != mongo.ErrNoDocuments {
			http.Error(w, "Activity already running", http.StatusBadRequest)
			return
		}

		bdy := startActivity{}
		b, _ := ioutil.ReadAll(r.Body)
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

func userId(r *http.Request) (string, error) {
	token, ok := r.Context().Value("user").(*jwt.Token)

	if !ok {
		return "", errors.New("Token not found")
	}

	userId, ok := token.Claims.(jwt.MapClaims)["sub"].(string)

	if !ok {
		return "", errors.New("User Id not found")
	}
	return userId, nil
}

func jsonResponse(w http.ResponseWriter, status int, a interface{}) error {
	b, err := json.Marshal(a)
	if err != nil {
		return errors.New("Wrong data format")
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
		userId, err := userId(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var running Activity
		err = store.Find(r.Context(), userId, runningBy(userId), &running)
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
		userId, err := userId(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var running Activity
		err = store.Find(r.Context(), userId, runningBy(userId), &running)
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
		userId, err := userId(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)

		var activity Activity
		err = store.Find(r.Context(), userId, byId(userId, vars[pathVariableId]), &activity)
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
		userId, err := userId(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		vars := mux.Vars(r)

		b, err := ioutil.ReadAll(r.Body)
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
		err = store.Find(r.Context(), userId, byId(userId, vars[pathVariableId]), &svdAct)
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
