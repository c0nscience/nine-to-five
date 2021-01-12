package store_test

import (
	"context"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"os"
	"testing"
	"time"
)

const timeout = 10 * time.Millisecond

func TestStore_New(t *testing.T) {
	subj := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))

	assert.NotNil(t, subj)
}

func TestStore_Disconnect(t *testing.T) {
	subj := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))

	ctx, _ := context.WithTimeout(context.Background(), timeout)
	err := subj.Disconnect(ctx)
	assert.NoError(t, err)
}

type A struct {
	S string
}

func TestStore_Save(t *testing.T) {
	subj := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))

	ctx, _ := context.WithTimeout(context.Background(), timeout)

	store.SetCollectionName("a")
	a := A{
		S: "value",
	}
	id, err := subj.Save(ctx, "userId", a)

	assert.NoError(t, err)
	assert.NotEqual(t, primitive.NilObjectID, id)
}

func TestStore_Find(t *testing.T) {
	subj := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))

	ctx, _ := context.WithTimeout(context.Background(), timeout)

	a := A{
		S: "value",
	}
	id, err := subj.Save(ctx, "userId", a)

	assert.NoError(t, err)

	var res A
	err = subj.Find(ctx, "userId", id.(primitive.ObjectID), &res)

	assert.NoError(t, err)
}
