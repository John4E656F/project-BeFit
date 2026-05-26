package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/John4E656F/project-BeFit/backend/database"
	"github.com/John4E656F/project-BeFit/backend/middleware"
	"github.com/John4E656F/project-BeFit/backend/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserHandler struct{}

func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetUserID(r)
	if clerkID == "" {
		Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	coll := database.GetCollection("users")
	var profile models.UserProfile
	err := coll.FindOne(r.Context(), bson.M{"clerkId": clerkID}).Decode(&profile)
	if err != nil {
		// Profile doesn't exist yet — create one
		profile = models.UserProfile{
			ID:        primitive.NewObjectID().Hex(),
			ClerkID:   clerkID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_, err := coll.InsertOne(r.Context(), profile)
		if err != nil {
			Error(w, http.StatusInternalServerError, "failed to create profile")
			return
		}
	}

	JSON(w, http.StatusOK, profile)
}

func (h *UserHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	clerkID := middleware.GetUserID(r)
	if clerkID == "" {
		Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var updates map[string]any
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Only allow specific fields
	allowed := map[string]bool{"name": true, "email": true, "goal": true}
	filtered := make(map[string]any)
	for k, v := range updates {
		if allowed[k] {
			filtered[k] = v
		}
	}
	filtered["updatedAt"] = time.Now()

	coll := database.GetCollection("users")
	_, err := coll.UpdateOne(
		r.Context(),
		bson.M{"clerkId": clerkID},
		bson.M{"$set": filtered},
	)
	if err != nil {
		Error(w, http.StatusInternalServerError, "failed to update profile")
		return
	}

	JSON(w, http.StatusOK, map[string]string{"status": "updated"})
}
