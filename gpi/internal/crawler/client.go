package crawler

import (
	"github.com/rs/zerolog/log"
	"io/ioutil"
	"net/http"
	"regexp"
)

type crawlerClient struct {
	url string
}

func New(url string) *crawlerClient {
	return &crawlerClient{
		url,
	}
}

func (me *crawlerClient) InStock(size string) bool {
	resp, err := http.Get(me.url)
	if err != nil {
		log.Error().Err(err)
		return false
	}
	defer resp.Body.Close()

	out, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Error().Err(err)
		return false
	}

	r := regexp.MustCompile(`(?m)<li.*?data-availability="available".*?>\n<a href="#">(` + size + `)</a>\n</li>`)

	b := r.FindStringSubmatch(string(out))
	return b != nil
}
