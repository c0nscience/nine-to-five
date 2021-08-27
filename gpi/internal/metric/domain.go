package metric

import (
	"github.com/c0nscience/nine-to-five/gpi/internal/store"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

var Collection store.CollectionName = "metricConfigurations"

var _ store.HasObjectId = &Configuration{}

type Configuration struct {
	Id        primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	UserId    string             `json:"userId,omitempty" bson:"userId,omitempty"`
	Name      string             `json:"name,omitempty" bson:"name,omitempty"`
	Tags      []string           `json:"tags,omitempty" bson:"tags,omitempty"`
	Threshold float64            `json:"threshold,omitempty" bson:"threshold,omitempty"`
}

func (c Configuration) ObjectId() primitive.ObjectID {
	return c.Id
}

func (c Configuration) SetObjectId(id primitive.ObjectID) {
	c.Id = id
}

type Result struct {
	Id                       string        `json:"id,omitempty" bson:"_id,omitempty"`
	Name                     string        `json:"name,omitempty" bson:"_id,omitempty"`
	TotalExceedingDuration   time.Duration `json:"totalExceedingDuration" bson:"totalExceedingDuration"`
	CurrentExceedingDuration time.Duration `json:"currentExceedingDuration" bson:"currentExceedingDuration"`
	Threshold                float64       `json:"threshold,omitempty" bson:"threshold,omitempty"`
	Values                   []Value       `json:"values,omitempty" bson:"values,omitempty"`
}

type Value struct {
	Duration time.Duration `json:"duration,omitempty" bson:"duration,omitempty"`
	Date     time.Time     `json:"date,omitempty" bson:"date,omitempty"`
}

type ByDate []Value

func (a ByDate) Len() int           { return len(a) }
func (a ByDate) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByDate) Less(i, j int) bool { return a[i].Date.Before(a[j].Date) }
