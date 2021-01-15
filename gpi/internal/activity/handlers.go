package activity

import (
	"encoding/json"
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
		token, ok := r.Context().Value("user").(*jwt.Token)

		if !ok {
			log.Error().Msg("Token not found")
			http.Error(w, "Token not found", http.StatusBadRequest)
			return
		}

		userId, ok := token.Claims.(jwt.MapClaims)["sub"].(string)

		if !ok {
			log.Error().Msg("User Id not found")
			http.Error(w, "User Id not found", http.StatusBadRequest)
			return
		}

		bdy := startActivity{}
		b, _ := ioutil.ReadAll(r.Body)
		err := json.Unmarshal(b, &bdy)
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

		w.Header().Set("Content-Type", "application/json")
		b, err = json.Marshal(a)
		if err != nil {
			http.Error(w, "Wrong data format", http.StatusInternalServerError)
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
