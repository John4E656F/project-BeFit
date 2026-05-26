package models

import "time"

type UserProfile struct {
	ID        string    `json:"id,omitempty" bson:"_id,omitempty"`
	ClerkID   string    `json:"clerkId" bson:"clerkId"`
	Email     string    `json:"email" bson:"email"`
	Name      string    `json:"name" bson:"name"`
	Goal      string    `json:"goal" bson:"goal"` // lose_weight, build_muscle, maintain
	CreatedAt time.Time `json:"createdAt" bson:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt" bson:"updatedAt"`
}