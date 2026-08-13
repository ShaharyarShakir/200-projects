package httpapi

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strings"

	"github.com/google/uuid"

	"github.com/ShaharyarShakir/academy-os/internal/academies"
	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/domains"
	"github.com/ShaharyarShakir/academy-os/internal/http/middleware"
)

var slugRegex = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type AcademyHandler struct {
	academies      *database.AcademyRepository
	domainResolver *domains.Resolver
}

func NewAcademyHandler(
	academies *database.AcademyRepository,
	domainResolver *domains.Resolver,
) *AcademyHandler {
	return &AcademyHandler{
		academies:      academies,
		domainResolver: domainResolver,
	}
}

type CreateAcademyRequest struct {
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	Subdomain string `json:"subdomain"`
}

func (h *AcademyHandler) Create(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserRecordFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// 1:1 check - verify instructor doesn't already own an academy
	existing, err := h.academies.FindByOwnerID(r.Context(), user.ID)
	if err == nil && existing.ID != uuid.Nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]any{
			"academy": existing,
			"tenant":  existing,
			"message": "instructor already owns an academy",
		})
		return
	}

	var req CreateAcademyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Slug = strings.TrimSpace(strings.ToLower(req.Slug))
	req.Subdomain = strings.TrimSpace(strings.ToLower(req.Subdomain))

	if req.Subdomain == "" {
		req.Subdomain = req.Slug
	}

	if req.Name == "" {
		http.Error(w, "academy name is required", http.StatusBadRequest)
		return
	}
	if len(req.Name) > 100 {
		http.Error(w, "academy name is too long", http.StatusBadRequest)
		return
	}

	if len(req.Slug) < 3 {
		http.Error(w, "slug must be at least 3 characters", http.StatusBadRequest)
		return
	}
	if len(req.Slug) > 63 {
		http.Error(w, "slug must be at most 63 characters", http.StatusBadRequest)
		return
	}
	if !slugRegex.MatchString(req.Slug) {
		http.Error(w, "slug contains invalid characters (must contain only lowercase letters, numbers, and hyphens)", http.StatusBadRequest)
		return
	}

	academyRecord, err := h.academies.Create(r.Context(), user.ID, req.Name, req.Slug, req.Subdomain)
	if err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			http.Error(w, "academy URL or subdomain is already taken or user already owns an academy", http.StatusBadRequest)
			return
		}
		http.Error(w, "failed to create academy: "+err.Error(), http.StatusBadRequest)
		return
	}

	publicURL := "http://" + academyRecord.Subdomain + ".academyos.local:3000"

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"academy":    academyRecord,
		"tenant":     academyRecord,
		"public_url": publicURL,
	})
}

func (h *AcademyHandler) GetPublicAcademy(w http.ResponseWriter, r *http.Request) {
	if academy, ok := academies.FromContext(r.Context()); ok && academy != nil {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"academy": academy,
		})
		return
	}

	if h.domainResolver != nil {
		academy, err := h.domainResolver.Resolve(r.Context(), r.Host)
		if err == nil && academy != nil {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]any{
				"academy": academy,
			})
			return
		}
	}

	http.Error(w, "academy not found", http.StatusNotFound)
}

func (h *AcademyHandler) GetMyAcademy(w http.ResponseWriter, r *http.Request) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if ok {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(acadCtx.Academy)
		return
	}

	user, ok := middleware.UserRecordFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	academy, err := h.academies.FindByOwnerID(r.Context(), user.ID)
	if err != nil {
		http.Error(w, "academy not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(academy)
}

func (h *AcademyHandler) ListMyAcademies(w http.ResponseWriter, r *http.Request) {
	user, ok := middleware.UserRecordFromContext(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	acadList := []database.AcademyRecord{}
	academy, err := h.academies.FindByOwnerID(r.Context(), user.ID)
	if err == nil && academy.ID != uuid.Nil {
		acadList = append(acadList, academy)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"academies": acadList,
		"tenants":   acadList,
	})
}

type UpdateAcademyBrandingRequest struct {
	Name           *string `json:"name"`
	Description    *string `json:"description"`
	LogoURL        *string `json:"logoUrl"`
	FaviconURL     *string `json:"faviconUrl"`
	PrimaryColor   *string `json:"primaryColor"`
	SecondaryColor *string `json:"secondaryColor"`
	CustomDomain   *string `json:"customDomain"`
}

func (h *AcademyHandler) UpdateBranding(w http.ResponseWriter, r *http.Request) {
	acadCtx, ok := middleware.AcademyContextFromRequest(r)
	if !ok {
		user, uOk := middleware.UserRecordFromContext(r.Context())
		if !uOk {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		acad, err := h.academies.FindByOwnerID(r.Context(), user.ID)
		if err != nil {
			http.Error(w, "academy not found", http.StatusNotFound)
			return
		}
		acadCtx = middleware.AcademyContext{User: user, Academy: acad}
	}

	var req UpdateAcademyBrandingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	updated, err := h.academies.UpdateBranding(r.Context(), acadCtx.Academy.ID, database.UpdateAcademyBrandingParams{
		Name:           req.Name,
		Description:    req.Description,
		LogoURL:        req.LogoURL,
		FaviconURL:     req.FaviconURL,
		PrimaryColor:   req.PrimaryColor,
		SecondaryColor: req.SecondaryColor,
		CustomDomain:   req.CustomDomain,
	})
	if err != nil {
		http.Error(w, "failed to update branding: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(updated)
}

func (h *AcademyHandler) ResolveAcademyByHost(w http.ResponseWriter, r *http.Request) {
	queryHost := r.URL.Query().Get("host")
	querySlug := r.URL.Query().Get("slug")
	queryDomain := r.URL.Query().Get("domain")

	targetHost := queryDomain
	if targetHost == "" {
		targetHost = queryHost
	}

	var academyRecord *database.AcademyRecord
	var err error

	if targetHost != "" {
		academyRecord, err = h.academies.ResolveByHost(r.Context(), targetHost)
	}

	if (academyRecord == nil || err != nil) && querySlug != "" {
		rec, findErr := h.academies.FindBySlug(r.Context(), querySlug)
		if findErr == nil {
			academyRecord = &rec
			err = nil
		}
	}

	if err != nil || academyRecord == nil {
		http.Error(w, "academy not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(academyRecord)
}
