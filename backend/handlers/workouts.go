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
	"go.mongodb.org/mongo-driver/mongo/options"
)

type WorkoutHandler struct{}

func NewWorkoutHandler() *WorkoutHandler {
	return &WorkoutHandler{}
}

func (h *WorkoutHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	ctx := r.Context()
	coll := database.GetCollection("workouts")

	cursor, err := coll.Find(ctx, bson.M{"userId": userID}, options.Find().SetSort(bson.M{"date": -1}))
	if err != nil {
		Error(w, http.StatusInternalServerError, "failed to fetch workouts")
		return
	}
	defer cursor.Close(ctx)

	var workouts []models.Workout
	if err := cursor.All(ctx, &workouts); err != nil {
		Error(w, http.StatusInternalServerError, "failed to decode workouts")
		return
	}

	if workouts == nil {
		workouts = []models.Workout{}
	}

	JSON(w, http.StatusOK, workouts)
}

func (h *WorkoutHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var workout models.Workout
	if err := json.NewDecoder(r.Body).Decode(&workout); err != nil {
		Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	workout.UserID = userID
	workout.CreatedAt = time.Now()
	workout.UpdatedAt = time.Now()

	if workout.Title == "" {
		Error(w, http.StatusBadRequest, "title is required")
		return
	}
	if workout.Date == "" {
		workout.Date = time.Now().Format("2006-01-02")
	}

	coll := database.GetCollection("workouts")
	result, err := coll.InsertOne(r.Context(), workout)
	if err != nil {
		Error(w, http.StatusInternalServerError, "failed to create workout")
		return
	}

	workout.ID = result.InsertedID.(primitive.ObjectID).Hex()
	JSON(w, http.StatusCreated, workout)
}

func (h *WorkoutHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id := r.PathValue("id")
	if id == "" {
		Error(w, http.StatusBadRequest, "id is required")
		return
	}

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	coll := database.GetCollection("workouts")
	var workout models.Workout
	err = coll.FindOne(r.Context(), bson.M{"_id": objID, "userId": userID}).Decode(&workout)
	if err != nil {
		Error(w, http.StatusNotFound, "workout not found")
		return
	}

	JSON(w, http.StatusOK, workout)
}

func (h *WorkoutHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id := r.PathValue("id")
	if id == "" {
		Error(w, http.StatusBadRequest, "id is required")
		return
	}

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	var updates map[string]any
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	delete(updates, "_id")
	delete(updates, "userId")
	updates["updatedAt"] = time.Now()

	coll := database.GetCollection("workouts")
	result, err := coll.UpdateOne(
		r.Context(),
		bson.M{"_id": objID, "userId": userID},
		bson.M{"$set": updates},
	)
	if err != nil {
		Error(w, http.StatusInternalServerError, "failed to update workout")
		return
	}

	if result.MatchedCount == 0 {
		Error(w, http.StatusNotFound, "workout not found")
		return
	}

	JSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (h *WorkoutHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		Error(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	id := r.PathValue("id")
	if id == "" {
		Error(w, http.StatusBadRequest, "id is required")
		return
	}

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	coll := database.GetCollection("workouts")
	result, err := coll.DeleteOne(r.Context(), bson.M{"_id": objID, "userId": userID})
	if err != nil {
		Error(w, http.StatusInternalServerError, "failed to delete workout")
		return
	}

	if result.DeletedCount == 0 {
		Error(w, http.StatusNotFound, "workout not found")
		return
	}

	JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
