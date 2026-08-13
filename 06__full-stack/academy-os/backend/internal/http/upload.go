package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/jobs"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
	"github.com/google/uuid"
)

type UploadHandler struct {
	storage *storage.Service
	assets  *database.AssetRepository
	queue   *jobs.RedisQueue
}

func NewUploadHandler(
	storage *storage.Service,
	assets *database.AssetRepository,
	queue *jobs.RedisQueue,
) *UploadHandler {
	return &UploadHandler{
		storage: storage,
		assets:  assets,
		queue:   queue,
	}
}

type PresignUploadResponse struct {
	AssetID   string `json:"assetId"`
	ObjectKey string `json:"objectKey"`
	UploadURL string `json:"uploadUrl"`
}

func (h *UploadHandler) Presign(w http.ResponseWriter, r *http.Request) {
	contentType := r.URL.Query().Get("contentType")
	filename := r.URL.Query().Get("filename")

	if contentType == "" {
		http.Error(w, "contentType is required", http.StatusBadRequest)
		return
	}

	objectKey := "uploads/" + uuid.NewString() + "/original.mp4"

	asset, err := h.assets.Create(r.Context(), objectKey, filename, contentType)
	if err != nil {
		http.Error(w, "failed to create asset", http.StatusInternalServerError)
		return
	}

	url, err := h.storage.PresignUpload(
		r.Context(),
		asset.ObjectKey,
		asset.ContentType,
	)
	if err != nil {
		http.Error(w, "failed to generate upload URL", http.StatusInternalServerError)
		return
	}

	response := PresignUploadResponse{
		AssetID:   asset.ID.String(),
		ObjectKey: asset.ObjectKey,
		UploadURL: url,
	}

	w.Header().Set("Content-Type", "application/json")

	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(response)
}

func (h *UploadHandler) Complete(w http.ResponseWriter, r *http.Request) {
	assetIDStr := r.PathValue("assetID")
	assetID, err := uuid.Parse(assetIDStr)
	if err != nil {
		http.Error(w, "invalid asset ID", http.StatusBadRequest)
		return
	}

	asset, err := h.assets.GetByID(r.Context(), assetID)
	if err != nil {
		http.Error(w, "asset not found", http.StatusNotFound)
		return
	}

	// 1. Verify object exists in Garage / S3 storage
	exists, err := h.storage.Exists(r.Context(), asset.ObjectKey)
	if err != nil {
		http.Error(w, "failed to check object existence: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if !exists {
		http.Error(w, "uploaded object does not exist in storage", http.StatusBadRequest)
		return
	}

	// 2. Transition asset status atomically from pending -> queued
	if err := h.assets.TransitionStatus(r.Context(), assetID, database.AssetStatusPending, database.AssetStatusQueued); err != nil {
		http.Error(w, "failed to update asset status: "+err.Error(), http.StatusBadRequest)
		return
	}

	// 3. Enqueue job into Redis
	job := jobs.VideoProcessingJob{
		AssetID:   asset.ID.String(),
		ObjectKey: asset.ObjectKey,
	}

	if err := h.queue.EnqueueVideoProcessing(r.Context(), job); err != nil {
		http.Error(w, "failed to enqueue job", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  database.AssetStatusQueued,
		"assetId": asset.ID.String(),
	})
}
