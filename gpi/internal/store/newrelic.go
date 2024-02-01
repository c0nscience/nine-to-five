package store

import (
	"context"
	"github.com/newrelic/go-agent/v3/newrelic"
)

type newrelicStore struct {
	app *newrelic.Application
	s   Store
}

func NewNewrelicStore(app *newrelic.Application, store Store) Store {
	return &newrelicStore{
		s:   store,
		app: app,
	}
}

func (me *newrelicStore) Disconnect(ctx context.Context) error {
	txn := me.app.StartTransaction("disconnect")
	return me.s.Disconnect(newrelic.NewContext(ctx, txn))
}

func (me *newrelicStore) Create(ctx context.Context, userId string, d interface{}) (interface{}, error) {
	txn := me.app.StartTransaction("create")
	return me.s.Create(newrelic.NewContext(ctx, txn), userId, d)
}

func (me *newrelicStore) Save(ctx context.Context, userId string, d HasObjectId) (interface{}, error) {
	txn := me.app.StartTransaction("save")
	return me.s.Save(newrelic.NewContext(ctx, txn), userId, d)
}

func (me *newrelicStore) FindOne(ctx context.Context, userId string, filter interface{}, rec interface{}) error {
	txn := me.app.StartTransaction("findOne")
	return me.s.FindOne(newrelic.NewContext(ctx, txn), userId, filter, rec)
}

func (me *newrelicStore) Find(ctx context.Context, userId string, filter interface{}, sort interface{}, rec interface{}) error {
	txn := me.app.StartTransaction("find")
	return me.s.Find(newrelic.NewContext(ctx, txn), userId, filter, sort, rec)
}

func (me *newrelicStore) DeleteAll(ctx context.Context, userId string) (int64, error) {
	txn := me.app.StartTransaction("deleteAll")
	return me.s.DeleteAll(newrelic.NewContext(ctx, txn), userId)
}

func (me *newrelicStore) DropCollection(ctx context.Context) error {
	txn := me.app.StartTransaction("dropCollection")
	return me.s.DropCollection(newrelic.NewContext(ctx, txn))
}

func (me *newrelicStore) Delete(ctx context.Context, userId string, filter interface{}, rec interface{}) error {
	txn := me.app.StartTransaction("delete")
	return me.s.Delete(newrelic.NewContext(ctx, txn), userId, filter, rec)
}

func (me *newrelicStore) Distinct(ctx context.Context, userId string, field string) ([]interface{}, error) {
	txn := me.app.StartTransaction("distinct")
	return me.s.Distinct(newrelic.NewContext(ctx, txn), userId, field)
}