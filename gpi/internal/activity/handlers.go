package activity

import (
	"encoding/json"
	"errors"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/dgrijalva/jwt-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"io/ioutil"
	"net/http"
	"time"
)

func Start(store *store.Store) http.HandlerFunc {
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
		start := time.Now()
		b, _ := ioutil.ReadAll(r.Body)
		err = json.Unmarshal(b, &bdy)
		clock.Track(start, "handlers.Start::read-and-unmarshal-body")
		defer r.Body.Close()
		if err != nil {
			http.Error(w, "Payload does not have correct format.", http.StatusBadRequest)
			return
		}

		var a *Activity
		start = time.Now()
		if bdy.Start == nil {
			a = New(userId, bdy.Name, bdy.Tags)
		} else {
			a = NewWithStart(userId, bdy.Name, *bdy.Start, bdy.Tags)
		}
		clock.Track(start, "handlers.Start::create-activity")

		id, err := store.Save(r.Context(), userId, a)

		if err != nil {
			http.Error(w, "Activity could not be started", http.StatusInternalServerError)
			return
		}

		a.Id = id.(primitive.ObjectID)

		err = jsonResponse(w, http.StatusCreated, a)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func userId(r *http.Request) (string, error) {
	start := time.Now()
	token, ok := r.Context().Value("user").(*jwt.Token)
	clock.Track(start, "handlers.Start::get-jwt-from-context")

	if !ok {
		return "", errors.New("Token not found")
	}

	start = time.Now()
	userId, ok := token.Claims.(jwt.MapClaims)["sub"].(string)
	clock.Track(start, "handlers.Start::get-user-id")

	if !ok {
		return "", errors.New("User Id not found")
	}
	return userId, nil
}

func jsonResponse(w http.ResponseWriter, status int, a interface{}) error {
	start := time.Now()
	b, err := json.Marshal(a)
	clock.Track(start, "handlers.Start::marshal-json")
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

func Stop(store *store.Store) http.HandlerFunc {
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
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func runningBy(userId string) bson.M {
	return bson.M{"userId": userId, "end": nil}
}
