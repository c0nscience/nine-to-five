package store

import (
	"context"
	"fmt"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/logger"
	"time"
)

var _ Store = &loggedStore{}

type loggedStore struct {
	s Store
}

func NewLogged(store Store) Store {
	return &loggedStore{
		s: store,
	}
}

func (me *loggedStore) Disconnect(ctx context.Context) error {
	defer clock.Track(time.Now(), withRequestId(ctx, "Store.Disconnect"))
	return me.s.Disconnect(ctx)
}

func (me *loggedStore) Create(ctx context.Context, userId string, d interface{}) (interface{}, error) {
	defer clock.Track(time.Now(), withRequestId(ctx, "Store.Create"))
	return me.s.Create(ctx, userId, d)
}

func (me *loggedStore) Save(ctx context.Context, userId string, d HasObjectId) (interface{}, error) {
	defer clock.Track(time.Now(), withRequestId(ctx, "Store.Save"))
	return me.s.Save(ctx, userId, d)
}

func (me *loggedStore) FindOne(ctx context.Context, userId string, filter interface{}, rec interface{}) error {
	defer clock.Track(time.Now(), withRequestId(ctx, "Store.FindOne"))
	return me.s.FindOne(ctx, userId, filter, rec)
}

func (me *loggedStore) Find(ctx context.Context, userId string, filter interface{}, sort interface{}, rec interface{}) error {
	defer clock.Track(time.Now(), withRequestId(ctx, "Store.Find"))
	return me.s.Find(ctx, userId, filter, sort, rec)
}

func (me *loggedStore) DeleteAll(ctx context.Context, userId string) (int64, error) {
	defer clock.Track(time.Now(), withRequestId(ctx, "Store.DeleteAll"))
	return me.s.DeleteAll(ctx, userId)
}

func (me *loggedStore) DropCollection(ctx context.Context) error {
	defer clock.Track(time.Now(), withRequestId(ctx, "Store.DropCollection"))
	return me.s.DropCollection(ctx)
}

func (me *loggedStore) Delete(ctx context.Context, userId string, filter interface{}, rec interface{}) error {
	defer clock.Track(time.Now(), withRequestId(ctx, "Store.Delete"))
	return me.s.Delete(ctx, userId, filter, rec)
}

func (me *loggedStore) Distinct(ctx context.Context, userId string, field string) ([]interface{}, error) {
	defer clock.Track(time.Now(), withRequestId(ctx, "Store.Distinct"))
	return me.s.Distinct(ctx, userId, field)
}

func withRequestId(ctx context.Context, s string) string {
	return fmt.Sprintf("request_id=%s %s", logger.GetRequestId(ctx), s)
}
