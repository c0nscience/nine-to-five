package store

import (
	"context"
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
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

func (me *Store) Create(ctx context.Context, userId string, d interface{}) (interface{}, error) {
	defer clock.Track(time.Now(), "Store.Create")
	colStart := time.Now()
	collection := me.db.Collection(collectionName)
	clock.Track(colStart, "Store.Create::retrieve-collection")

	insStart := time.Now()
	result, err := collection.InsertOne(ctx, d)
	clock.Track(insStart, "Store.Create::insert")
	if err != nil {
		return nil, err
	}

	return result.InsertedID, nil
}

func (me *Store) Save(ctx context.Context, userId string, d HasObjectId) (interface{}, error) {
	col := me.db.Collection(collectionName)

	opts := options.
		FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)
	var objectId = d.ObjectId()
	if objectId == primitive.NilObjectID {
		objectId = primitive.NewObjectID()
		d.SetObjectId(objectId)
	}
	res := col.FindOneAndUpdate(ctx, bson.M{"_id": objectId}, bson.D{{"$set", d}}, opts)

	if res.Err() != nil {
		return nil, res.Err()
	}

	var s bson.D
	err := res.Decode(&s)
	if err != nil {
		return nil, err
	}
	return s.Map()["_id"], nil
}

func (me *Store) Find(ctx context.Context, userId string, filter interface{}, rec interface{}) error {
	col := me.db.Collection(collectionName)

	res := col.FindOne(ctx, filter)

	if rec != nil {
		return res.Decode(rec)
	}

	return res.Err()
}

func (me *Store) DeleteAll(ctx context.Context, userId string) (int64, error) {
	col := me.db.Collection(collectionName)
	result, err := col.DeleteMany(ctx, bson.M{"userId": bson.M{"$eq": userId}})
	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil
}

func (me *Store) DropCollection(ctx context.Context) error {
	return me.db.Collection(collectionName).Drop(ctx)
}

type HasObjectId interface {
	ObjectId() primitive.ObjectID
	SetObjectId(id primitive.ObjectID)
}
