package activity

import (
	"encoding/json"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/dgrijalva/jwt-go"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"io/ioutil"
	"net/http"
	"time"
)

func Start(store *store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		token, ok := r.Context().Value("user").(*jwt.Token)
		clock.Track(start, "handlers.Start::get-jwt-from-context")

		if !ok {
			log.Error().Msg("Token not found")
			http.Error(w, "Token not found", http.StatusBadRequest)
			return
		}

		start = time.Now()
		userId, ok := token.Claims.(jwt.MapClaims)["sub"].(string)
		clock.Track(start, "handlers.Start::get-user-id")

		if !ok {
			log.Error().Msg("User Id not found")
			http.Error(w, "User Id not found", http.StatusBadRequest)
			return
		}

		bdy := startActivity{}
		start = time.Now()
		b, _ := ioutil.ReadAll(r.Body)
		err := json.Unmarshal(b, &bdy)
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

		w.Header().Set("Content-Type", "application/json")
		start = time.Now()
		b, err = json.Marshal(a)
		clock.Track(start, "handlers.Start::marshal-json")
		if err != nil {
			http.Error(w, "Wrong data format", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		w.Write(b)
	}
}

type startActivity struct {
	Name  string     `json:"name"`
	Start *time.Time `json:"start"`
	Tags  []string   `json:"tags"`
}
