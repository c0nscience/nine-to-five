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

type Store interface {
	Disconnect(ctx context.Context) error
	Create(ctx context.Context, userId string, d interface{}) (interface{}, error)
	Save(ctx context.Context, userId string, d HasObjectId) (interface{}, error)
	FindOne(ctx context.Context, userId string, filter interface{}, rec interface{}) error
	Find(ctx context.Context, userId string, filter interface{}, sort interface{}, rec interface{}) error
	DeleteAll(ctx context.Context, userId string) (int64, error)
	DropCollection(ctx context.Context) error
	Delete(ctx context.Context, userId string, filter interface{}, rec interface{}) error
	Distinct(ctx context.Context, userId string, field string) ([]interface{}, error)
}

var _ Store = &mongoDbStore{}

type CollectionName string

type mongoDbStore struct {
	client *mongo.Client
	coll   *mongo.Collection
}

func New(uri, db string, collection CollectionName) (Store, error) {
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI)

	ctx, cncl := context.WithTimeout(context.Background(), 5*time.Second)
	defer cncl()
	cl, err := mongo.Connect(ctx, opts)
	if err != nil {
		log.Fatal().Err(err).
			Msg("could not create mongodb client")
		return nil, err
	}

	err = cl.Ping(ctx, readpref.Primary())
	if err != nil {
		log.Fatal().Err(err).
			Msg("cloud not ping database")
		return nil, err
	}

	database := cl.Database(db)
	return &mongoDbStore{
		client: cl,
		coll:   database.Collection(string(collection)),
	}, err
}

func (me *mongoDbStore) Disconnect(ctx context.Context) error {
	return me.client.Disconnect(ctx)
}

func (me *mongoDbStore) Create(ctx context.Context, userId string, d interface{}) (interface{}, error) {
	result, err := me.coll.InsertOne(ctx, d)
	if err != nil {
		return nil, err
	}

	return result.InsertedID, nil
}

func (me *mongoDbStore) Save(ctx context.Context, userId string, d HasObjectId) (interface{}, error) {
	opts := options.
		FindOneAndUpdate().
		SetUpsert(true).
		SetReturnDocument(options.After)
	var objectId = d.ObjectId()
	if objectId == primitive.NilObjectID {
		objectId = primitive.NewObjectID()
		d.SetObjectId(objectId)
	}
	res := me.coll.FindOneAndUpdate(ctx, bson.M{"_id": objectId}, bson.D{{Key: "$set", Value: d}}, opts)

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

func (me *mongoDbStore) FindOne(ctx context.Context, userId string, filter interface{}, rec interface{}) error {
	res := me.coll.FindOne(ctx, filter)

	if rec != nil {
		return res.Decode(rec)
	}

	return res.Err()
}

func (me *mongoDbStore) Find(ctx context.Context, userId string, filter interface{}, sort interface{}, rec interface{}) error {
	opts := options.Find()
	if sort != nil {
		opts.SetSort(sort)
	}
	cur, err := me.coll.Find(ctx, filter, opts)
	if err != nil {
		return err
	}

	return cur.All(ctx, rec)
}

func (me *mongoDbStore) DeleteAll(ctx context.Context, userId string) (int64, error) {
	result, err := me.coll.DeleteMany(ctx, bson.M{"userId": bson.M{"$eq": userId}})
	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil
}

func (me *mongoDbStore) DropCollection(ctx context.Context) error {
	return me.coll.Drop(ctx)
}

func (me *mongoDbStore) Delete(ctx context.Context, userId string, filter interface{}, rec interface{}) error {
	res := me.coll.FindOneAndDelete(ctx, filter)

	if rec != nil {
		return res.Decode(rec)
	}

	return res.Err()
}

func (me *mongoDbStore) Distinct(ctx context.Context, userId string, field string) ([]interface{}, error) {
	return me.coll.Distinct(ctx, field, bson.D{{Key: "userId", Value: bson.D{{Key: "$eq", Value: userId}}}})
}

type HasObjectId interface {
	ObjectId() primitive.ObjectID
	SetObjectId(id primitive.ObjectID)
}
