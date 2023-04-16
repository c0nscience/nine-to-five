package store_test

import (
	"context"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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
	subj, err := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), "test")
	assert.NoError(t, err)
	assert.NotNil(t, subj)
}

func TestStore_Disconnect(t *testing.T) {
	subj, err := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), "test")
	assert.NoError(t, err)

	ctx, cncl := context.WithTimeout(context.Background(), timeout)
	defer cncl()
	err = subj.Disconnect(ctx)
	assert.NoError(t, err)
}

type A struct {
	Id     primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserId string             `json:"userId,omitempty" bson:"userId,omitempty"`
	S      string             `json:"s,omitempty" bson:"s,omitempty"`
	Arr    []string           `json:"arr,omitempty" bson:"arr,omitempty"`
}

func (me *A) SetObjectId(id primitive.ObjectID) {
	me.Id = id
}

func (me *A) ObjectId() primitive.ObjectID {
	return me.Id
}

func TestStore_Save(t *testing.T) {
	subj, err := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), "test")
	assert.NoError(t, err)
	ctx, cncl := context.WithTimeout(context.Background(), timeout)
	t.Cleanup(func() {
		subj.DropCollection(ctx)
		cncl()
	})

	a := A{
		S: "value",
	}
	id, err := subj.Save(ctx, "userId", &a)

	assert.NoError(t, err)
	assert.NotEqual(t, primitive.NilObjectID, id)
}

func TestStore_FindOne(t *testing.T) {
	subj, err := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), "test")
	assert.NoError(t, err)
	ctx, cncl := context.WithTimeout(context.Background(), timeout)
	t.Cleanup(func() {
		subj.DropCollection(ctx)
		cncl()
	})

	a := A{
		S: "value",
	}
	id, err := subj.Create(ctx, "userId", a)

	assert.NoError(t, err)

	var res A
	err = subj.FindOne(ctx, "userId", bson.M{"_id": id.(primitive.ObjectID)}, &res)

	assert.NoError(t, err)
}

func TestStore_Delete(t *testing.T) {
	subj, err := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), "test")
	assert.NoError(t, err)
	ctx, cncl := context.WithTimeout(context.Background(), timeout)
	t.Cleanup(func() {
		subj.DropCollection(ctx)
		cncl()
	})

	a := A{
		S: "value",
	}
	id, err := subj.Create(ctx, "userId", a)

	assert.NoError(t, err)

	var res A
	err = subj.Delete(ctx, "userId", bson.M{"_id": id.(primitive.ObjectID)}, &res)
	assert.NoError(t, err)

	err = subj.FindOne(ctx, "userId", bson.M{"_id": id.(primitive.ObjectID)}, &res)
	assert.Error(t, err)
	assert.Equal(t, mongo.ErrNoDocuments, err)
}

func TestStore_Distinct(t *testing.T) {
	subj, err := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), "test")
	assert.NoError(t, err)
	ctx, cncl := context.WithTimeout(context.Background(), timeout)
	t.Cleanup(func() {
		subj.DropCollection(ctx)
		cncl()
	})

	userId := "userId"
	subj.Save(ctx, userId, &A{
		UserId: userId,
		Arr:    []string{"val1"},
	})

	subj.Save(ctx, userId, &A{
		UserId: userId,
		Arr:    []string{"val2"},
	})

	res, err := subj.Distinct(ctx, userId, "arr")
	assert.NoError(t, err)
	assert.Equal(t, []interface{}{"val1", "val2"}, res)
}

func TestStore_Find(t *testing.T) {
	subj, err := store.New(os.Getenv("DB_URI"), os.Getenv("DB_NAME"), "test")
	assert.NoError(t, err)
	ctx, cncl := context.WithTimeout(context.Background(), timeout)
	t.Cleanup(func() {
		subj.DropCollection(ctx)
		cncl()
	})

	subj.Save(ctx, "userId", &A{
		UserId: "userId",
		S:      "value2",
	})

	subj.Save(ctx, "userId", &A{
		UserId: "userId",
		S:      "value1",
	})

	var res []A
	err = subj.Find(context.TODO(), "userId", bson.D{{Key: "userId", Value: "userId"}}, nil, &res)

	assert.NoError(t, err)
	assert.Len(t, res, 2)
	assert.Equal(t, "value2", res[0].S)
	assert.Equal(t, "value1", res[1].S)
}
