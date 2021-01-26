package store

import (
	"context"
	"github.com/stretchr/testify/assert"
	"testing"
)

type testStore struct {
	Invoked bool
}

func (me *testStore) Disconnect(context.Context) error {
	me.Invoked = true
	return nil
}

func (me *testStore) Create(context.Context, string, interface{}) (interface{}, error) {
	me.Invoked = true
	return nil, nil
}

func (me *testStore) Save(context.Context, string, HasObjectId) (interface{}, error) {
	me.Invoked = true
	return nil, nil
}

func (me *testStore) FindOne(context.Context, string, interface{}, interface{}) error {
	me.Invoked = true
	return nil
}

func (me *testStore) Find(context.Context, string, interface{}, interface{}, interface{}) error {
	me.Invoked = true
	return nil
}

func (me *testStore) DeleteAll(context.Context, string) (int64, error) {
	me.Invoked = true
	return 0, nil
}

func (me *testStore) DropCollection(context.Context) error {
	me.Invoked = true
	return nil
}

func (me *testStore) Delete(context.Context, string, interface{}, interface{}) error {
	me.Invoked = true
	return nil
}

func (me *testStore) Distinct(context.Context, string, string) ([]interface{}, error) {
	me.Invoked = true
	return nil, nil
}

var _ Store = &testStore{}

func TestLogger(t *testing.T) {
	t.Run("Disconnect", func(t *testing.T) {
		store := &testStore{
			Invoked: false,
		}
		subj := NewLogged(store)
		subj.Disconnect(context.TODO())
		assert.True(t, store.Invoked)
	})
	t.Run("Create", func(t *testing.T) {
		store := &testStore{
			Invoked: false,
		}
		subj := NewLogged(store)
		subj.Create(context.TODO(), "", nil)
		assert.True(t, store.Invoked)
	})
	t.Run("Save", func(t *testing.T) {
		store := &testStore{
			Invoked: false,
		}
		subj := NewLogged(store)
		subj.Save(context.TODO(), "", nil)
		assert.True(t, store.Invoked)
	})
	t.Run("FindOne", func(t *testing.T) {
		store := &testStore{
			Invoked: false,
		}
		subj := NewLogged(store)
		subj.FindOne(context.TODO(), "", nil, nil)
		assert.True(t, store.Invoked)
	})
	t.Run("Find", func(t *testing.T) {
		store := &testStore{
			Invoked: false,
		}
		subj := NewLogged(store)
		subj.Find(context.TODO(), "", nil, nil, nil)
		assert.True(t, store.Invoked)
	})
	t.Run("DeleteAll", func(t *testing.T) {
		store := &testStore{
			Invoked: false,
		}
		subj := NewLogged(store)
		subj.DeleteAll(context.TODO(), "")
		assert.True(t, store.Invoked)
	})
	t.Run("DropCollection", func(t *testing.T) {
		store := &testStore{
			Invoked: false,
		}
		subj := NewLogged(store)
		subj.DropCollection(context.TODO())
		assert.True(t, store.Invoked)
	})
	t.Run("Delete", func(t *testing.T) {
		store := &testStore{
			Invoked: false,
		}
		subj := NewLogged(store)
		subj.Delete(context.TODO(), "", nil, nil)
		assert.True(t, store.Invoked)
	})
	t.Run("Distinct", func(t *testing.T) {
		store := &testStore{
			Invoked: false,
		}
		subj := NewLogged(store)
		subj.Distinct(context.TODO(), "", "")
		assert.True(t, store.Invoked)
	})
}
