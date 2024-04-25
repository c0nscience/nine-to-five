package clock

import (
	"github.com/rs/zerolog/log"
	"time"
)

func Track(start time.Time, name string) {
	e := time.Since(start)
	log.Info().Msgf("%s took %s", name, e)
}
