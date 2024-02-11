package ping

import (
	"encoding/json"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/rs/zerolog/log"
	"net/http"
)

func Handler(s store.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err := s.Ping(r.Context())
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Error().Err(err).Msg("could not ping database")
			return
		}

		err = json.NewEncoder(w).Encode(map[string]bool{"ok": true})
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Error().Err(err).Msg("could not write ping response")
			return
		}
	}
}
