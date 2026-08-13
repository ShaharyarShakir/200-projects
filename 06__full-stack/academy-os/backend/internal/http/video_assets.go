package httpapi

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/http/middleware"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
	"github.com/ShaharyarShakir/academy-os/internal/video"
)

type VideoAssetHandler struct {
	videoService *video.Service
	s3           *storage.Service
}

func NewVideoAssetHandler(videoService *video.Service, s3 *storage.Service) *VideoAssetHandler {
	return &VideoAssetHandler{
		videoService: videoService,
		s3:           s3,
	}
}

func (h *VideoAssetHandler) resolveAcademyID(r *http.Request) (uuid.UUID, bool) {
	if acadCtx, ok := middleware.AcademyContextFromRequest(r); ok {
		return acadCtx.Academy.ID, true
	}
	if acadCtx, ok := middleware.AcademyContextFromContext(r.Context()); ok {
		return acadCtx.Academy.ID, true
	}
	if user, ok := middleware.UserRecordFromContext(r.Context()); ok {
		return user.ID, true
	}
	return uuid.Nil, false
}

func (h *VideoAssetHandler) CreateUpload(w http.ResponseWriter, r *http.Request) {
	academyID, ok := h.resolveAcademyID(r)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "academy context required"})
		return
	}

	var req video.CreateUploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "invalid request body"})
		return
	}

	if req.Filename == "" || req.MimeType == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "filename and mime_type are required"})
		return
	}

	res, err := h.videoService.CreateUpload(r.Context(), academyID, req)
	if err != nil {
		log.Printf("[CreateUpload Error] %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(res)
}

func (h *VideoAssetHandler) UploadContent(w http.ResponseWriter, r *http.Request) {
	academyID, ok := h.resolveAcademyID(r)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "academy context required"})
		return
	}

	assetIDStr := r.PathValue("assetID")
	assetID, err := uuid.Parse(assetIDStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "invalid asset ID"})
		return
	}

	contentType := r.Header.Get("Content-Type")
	if err := h.videoService.DirectUpload(r.Context(), academyID, assetID, r.Body, contentType); err != nil {
		log.Printf("[UploadContent Error] %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *VideoAssetHandler) CompleteUpload(w http.ResponseWriter, r *http.Request) {
	academyID, ok := h.resolveAcademyID(r)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "academy context required"})
		return
	}

	assetIDStr := r.PathValue("assetID")
	assetID, err := uuid.Parse(assetIDStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "invalid asset ID"})
		return
	}

	err = h.videoService.CompleteUpload(r.Context(), academyID, assetID)
	if err != nil {
		log.Printf("[CompleteUpload Error] %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": err.Error()})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *VideoAssetHandler) GetAsset(w http.ResponseWriter, r *http.Request) {
	academyID, ok := h.resolveAcademyID(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	assetIDStr := r.PathValue("assetID")
	assetID, err := uuid.Parse(assetIDStr)
	if err != nil {
		http.Error(w, "invalid asset ID", http.StatusBadRequest)
		return
	}

	asset, err := h.videoService.GetAsset(r.Context(), academyID, assetID)
	if err != nil {
		http.Error(w, "asset not found", http.StatusNotFound)
		return
	}

	var streamURL string
	if asset.Status == "ready" {
		streamURL = "/api/video-assets/" + asset.ID.String() + "/stream/master.m3u8"
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"id":               asset.ID,
		"status":           asset.Status,
		"filename":         asset.OriginalFilename,
		"mime_type":        asset.MimeType,
		"duration_seconds": asset.DurationSeconds,
		"error_message":    asset.ErrorMessage,
		"stream_url":       streamURL,
	})
}

func (h *VideoAssetHandler) StreamContent(w http.ResponseWriter, r *http.Request) {
	academyID, ok := h.resolveAcademyID(r)
	if !ok {
		http.Error(w, "academy context required", http.StatusForbidden)
		return
	}

	assetIDStr := r.PathValue("assetID")
	assetID, err := uuid.Parse(assetIDStr)
	if err != nil {
		http.Error(w, "invalid asset ID", http.StatusBadRequest)
		return
	}

	asset, err := h.videoService.GetAsset(r.Context(), academyID, assetID)
	if err != nil {
		http.Error(w, "asset not found", http.StatusNotFound)
		return
	}

	if asset.Status != "ready" {
		http.Error(w, "video asset is not ready", http.StatusPreconditionFailed)
		return
	}

	subpath := r.PathValue("filepath")
	if subpath == "" {
		subpath = "master.m3u8"
	}

	objectKey := "hls/" + asset.ID.String() + "/" + subpath

	if strings.HasSuffix(subpath, ".m3u8") {
		w.Header().Set("Content-Type", "application/x-mpegURL")
	} else if strings.HasSuffix(subpath, ".ts") {
		w.Header().Set("Content-Type", "video/MP2T")
	}
	w.Header().Set("Cache-Control", "public, max-age=3600")

	if err := h.s3.Get(r.Context(), objectKey, w); err != nil {
		log.Printf("[StreamContent Error] failed to stream key %s: %v", objectKey, err)
		http.Error(w, "stream chunk not found", http.StatusNotFound)
		return
	}
}
