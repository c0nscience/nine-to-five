package activity

import (
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type Activity struct {
	Id     primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserId string             `json:"userId,omitempty" bson:"userId,omitempty"`
	Name   string             `json:"name,omitempty" bson:"name,omitempty"`
	Start  time.Time          `json:"start,omitempty" bson:"start,omitempty"`
	End    *time.Time         `json:"end,omitempty" bson:"end,omitempty"`
	Tags   []string           `json:"tags,omitempty" bson:"tags,omitempty"`
}

var _ store.HasObjectId = &Activity{}

func (me *Activity) ObjectId() primitive.ObjectID {
	return me.Id
}

func (me *Activity) SetObjectId(id primitive.ObjectID) {
	me.Id = id
}

func New(userId, name string, tags []string) *Activity {
	return NewWithStart(userId, name, clock.Now().UTC(), tags)
}

func NewWithStart(userId, name string, start time.Time, tags []string) *Activity {
	return &Activity{
		Id:     primitive.NilObjectID,
		UserId: userId,
		Name:   name,
		Start:  clock.Adjust(start),
		Tags:   tags,
	}
}

func (a *Activity) Stop() {
	now := clock.Adjust(clock.Now().UTC())
	a.End = &now
}
