package models

import "time"

type Exercise struct {
	Name     string  `json:"name" bson:"name"`
	Sets     int     `json:"sets" bson:"sets"`
	Reps     int     `json:"reps" bson:"reps"`
	WeightKg float64 `json:"weightKg" bson:"weightKg"`
}

type Workout struct {
	ID        string     `json:"id,omitempty" bson:"_id,omitempty"`
	UserID    string     `json:"userId" bson:"userId"`
	Title     string     `json:"title" bson:"title"`
	Exercises []Exercise `json:"exercises" bson:"exercises"`
	Notes     string     `json:"notes" bson:"notes"`
	Date      string     `json:"date" bson:"date"`
	Duration  int        `json:"duration" bson:"duration"` // minutes
	CreatedAt time.Time  `json:"createdAt" bson:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt" bson:"updatedAt"`
}