package ping

import (
	"encoding/json"
	"github.com/rs/zerolog/log"
	"net/http"
)

func Handler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err := json.NewEncoder(w).Encode(map[string]bool{"ok": true})
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			log.Error().Err(err).Msg("could not write ping response")
			return
		}
	}
}
