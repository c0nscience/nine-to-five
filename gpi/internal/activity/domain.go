package activity

import (
	"github.com/c0nscience/nine-to-five/gpi/internal/clock"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type Activity struct {
	Id     primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserId string             `json:"userId,omitempty" bson:"userId,omitempty"`
	Name   string             `json:"name,omitempty" bson:"name,omitempty"`
	Start  time.Time          `json:"start,omitempty" bson:"start,omitempty"`
	Tags   []string           `json:"tags,omitempty" bson:"tags,omitempty"`
}

func New(userId, name string, tags []string) *Activity {
	return NewWithStart(userId, name, clock.Now(), tags)
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
