package store

import (
	"context"
	"github.com/rs/zerolog/log"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
	"time"
)

var collectionName = "activities"

func SetCollectionName(s string) {
	collectionName = s
}

type Store struct {
	client *mongo.Client
	db     *mongo.Database
}

func New(uri, db string) *Store {
	ctx, cncl := context.WithTimeout(context.Background(), 5*time.Second)
	defer cncl()
	cl, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal().Err(err).
			Msg("could not create mongodb client")
	}

	err = cl.Ping(ctx, readpref.Primary())
	if err != nil {
		log.Fatal().Err(err).
			Msg("cloud not ping database")
	}

	return &Store{
		client: cl,
		db:     cl.Database(db),
	}
}

func (me *Store) Disconnect(ctx context.Context) error {
	return me.client.Disconnect(ctx)
}

func (me *Store) Save(ctx context.Context, userId string, d interface{}) (interface{}, error) {
	collection := me.db.Collection(collectionName)

	result, err := collection.InsertOne(ctx, d)
	if err != nil {
		return nil, err
	}

	return result.InsertedID, nil
}

func (me *Store) Find(ctx context.Context, userId string, id primitive.ObjectID, rec interface{}) error {
	collection := me.db.Collection(collectionName)

	result := collection.FindOne(ctx, bson.M{"_id": id})

	return result.Decode(rec)
}
