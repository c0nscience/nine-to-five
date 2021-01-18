package store_test

import (
	"context"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"os"
	"testing"
	"time"
)

const timeout = 100 * time.Millisecond

func init() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

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
	Id primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	S  string
}

func (me *A) SetObjectId(id primitive.ObjectID) {
	me.Id = id
}

func (me *A) ObjectId() primitive.ObjectID {
	return me.Id
}

func TestStore_Save(t *testing.T) {
	subj := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))
	store.SetCollectionName("a")
	ctx, _ := context.WithTimeout(context.Background(), timeout)
	defer subj.DropCollection(ctx)

	a := A{
		S: "value",
	}
	id, err := subj.Save(ctx, "userId", &a)

	assert.NoError(t, err)
	assert.NotEqual(t, primitive.NilObjectID, id)
}

func TestStore_Find(t *testing.T) {
	subj := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"))
	store.SetCollectionName("a")
	ctx, _ := context.WithTimeout(context.Background(), timeout)
	defer subj.DropCollection(ctx)

	a := A{
		S: "value",
	}
	id, err := subj.Create(ctx, "userId", a)

	assert.NoError(t, err)

	var res A
	err = subj.Find(ctx, "userId", bson.M{"_id": id.(primitive.ObjectID)}, &res)

	assert.NoError(t, err)
}
