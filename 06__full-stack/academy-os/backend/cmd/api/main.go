package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"github.com/ShaharyarShakir/academy-os/internal/cache"
	"github.com/ShaharyarShakir/academy-os/internal/config"
	"github.com/ShaharyarShakir/academy-os/internal/course"
	"github.com/ShaharyarShakir/academy-os/internal/database"
	"github.com/ShaharyarShakir/academy-os/internal/domains"
	httpapi "github.com/ShaharyarShakir/academy-os/internal/http"
	"github.com/ShaharyarShakir/academy-os/internal/http/middleware"
	"github.com/ShaharyarShakir/academy-os/internal/jobs"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
	"github.com/ShaharyarShakir/academy-os/internal/video"
)

type HealthResponse struct {
	Status string `json:"status"`
}

type ReadinessResponse struct {
	Status       string            `json:"status"`
	Dependencies map[string]string `json:"dependencies"`
}

func main() {
	_ = godotenv.Load("../.env", ".env")

	cfg := config.Load()
	ctx := context.Background()

	db, err := database.NewPostgres(ctx, cfg.Postgres)
	if err != nil {
		log.Fatalf("database initialization failed: %v", err)
	}
	defer db.Close()

	if err := database.RunMigrations(cfg.Postgres.ConnString(), "migrations"); err != nil {
		log.Fatalf("database migration failed: %v", err)
	}

	redis, err := cache.NewRedis(ctx, cfg.Redis)
	if err != nil {
		log.Fatalf("redis initialization failed: %v", err)
	}
	defer redis.Close()

	s3Service, err := storage.NewS3(ctx, cfg.S3)
	if err != nil {
		log.Fatalf("S3 initialization failed: %v", err)
	}

	if err := storage.TestConnection(ctx, s3Service); err != nil {
		log.Fatalf("S3 connection failed: %v", err)
	}

	log.Println("S3 connection established")

	// Repositories
	academyRepo := database.NewAcademyRepository(db)
	assetRepo := database.NewAssetRepository(db)
	userRepo := database.NewUserRepository(db)
	sessionRepo := database.NewSessionRepository(db)
	courseRepo := database.NewCourseRepository(db)
	sectionRepo := database.NewSectionRepository(db)
	lessonRepo := database.NewLessonRepository(db)
	enrollmentRepo := database.NewEnrollmentRepository(db)
	progressRepo := database.NewLessonProgressRepository(db)

	// Domain Services
	domainResolver := domains.NewResolver(academyRepo)
	_ = domains.NewMiddleware(domainResolver)

	courseService := course.NewService(courseRepo, sectionRepo, lessonRepo)
	publisher := course.NewPublisher(courseRepo, sectionRepo, lessonRepo)
	jobQueue := jobs.NewQueue(redis)

	videoService := video.NewService(
		assetRepo,
		courseRepo,
		sectionRepo,
		lessonRepo,
		s3Service,
		jobQueue,
	)

	// HTTP Handlers
	authHandler := httpapi.NewAuthHandler(userRepo, sessionRepo, academyRepo)
	academyHandler := httpapi.NewAcademyHandler(academyRepo, domainResolver)
	adminHandler := httpapi.NewPlatformAdminHandler(academyRepo, userRepo, courseRepo)
	courseHandler := httpapi.NewCourseHandler(courseService, publisher)
	publicCourseHandler := httpapi.NewPublicCourseHandler(academyRepo, courseRepo, sectionRepo, lessonRepo, enrollmentRepo, sessionRepo)
	enrollmentHandler := httpapi.NewEnrollmentHandler(academyRepo, courseRepo, enrollmentRepo)
	learnHandler := httpapi.NewLearnHandler(academyRepo, courseRepo, sectionRepo, lessonRepo, assetRepo, enrollmentRepo, progressRepo, s3Service)
	videoAssetHandler := httpapi.NewVideoAssetHandler(videoService, s3Service)
	uploadHandler := httpapi.NewUploadHandler(s3Service, assetRepo, jobQueue)

	// Middleware
	authMiddleware := middleware.WithAuth(sessionRepo, userRepo)
	instructorAcademyMiddleware := middleware.WithInstructorAcademy(academyRepo)
	platformAdminMiddleware := middleware.RequirePlatformAdmin()

	mux := http.NewServeMux()

	// Process Liveness Check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(HealthResponse{Status: "ok"})
	})

	// Service Readiness Check
	mux.HandleFunc("GET /health/ready", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		deps := map[string]string{
			"postgres": "ok",
			"redis":    "ok",
			"storage":  "ok",
		}
		allOk := true

		if err := db.Ping(r.Context()); err != nil {
			deps["postgres"] = "error: " + err.Error()
			allOk = false
		}

		if err := redis.Ping(r.Context()).Err(); err != nil {
			deps["redis"] = "error: " + err.Error()
			allOk = false
		}

		if err := storage.TestConnection(r.Context(), s3Service); err != nil {
			deps["storage"] = "error: " + err.Error()
			allOk = false
		}

		status := "ok"
		statusCode := http.StatusOK
		if !allOk {
			status = "degraded"
			statusCode = http.StatusServiceUnavailable
		}

		w.WriteHeader(statusCode)
		_ = json.NewEncoder(w).Encode(ReadinessResponse{
			Status:       status,
			Dependencies: deps,
		})
	})

	// Auth Endpoints
	mux.HandleFunc("POST /api/auth/signup", authHandler.Signup)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/auth/logout", authHandler.Logout)
	mux.HandleFunc("GET /api/auth/me", authHandler.Me)

	// Instructor Onboarding & Academy Management (1:1 Model)
	mux.Handle("GET /api/academies", authMiddleware(http.HandlerFunc(academyHandler.ListMyAcademies)))
	mux.Handle("GET /api/tenants", authMiddleware(http.HandlerFunc(academyHandler.ListMyAcademies)))
	mux.Handle("GET /api/me/tenants", authMiddleware(http.HandlerFunc(academyHandler.ListMyAcademies)))
	mux.Handle("POST /api/academies", authMiddleware(http.HandlerFunc(academyHandler.Create)))
	mux.Handle("POST /api/tenants", authMiddleware(http.HandlerFunc(academyHandler.Create)))
	mux.Handle("GET /api/academy", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(academyHandler.GetMyAcademy))))
	mux.Handle("PATCH /api/academy", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(academyHandler.UpdateBranding))))
	mux.Handle("GET /api/tenants/current", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(academyHandler.GetMyAcademy))))
	mux.Handle("GET /api/academy/students", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(enrollmentHandler.ListAcademyStudents))))

	// Platform Admin System Routes (/api/admin/*)
	mux.Handle("GET /api/admin/stats", authMiddleware(platformAdminMiddleware(http.HandlerFunc(adminHandler.GetStats))))
	mux.Handle("GET /api/admin/academies", authMiddleware(platformAdminMiddleware(http.HandlerFunc(adminHandler.ListAcademies))))
	mux.Handle("GET /api/admin/instructors", authMiddleware(platformAdminMiddleware(http.HandlerFunc(adminHandler.ListInstructors))))
	mux.Handle("POST /api/admin/academies/{academyID}/status", authMiddleware(platformAdminMiddleware(http.HandlerFunc(adminHandler.UpdateAcademyStatus))))

	// Public Domain & Tenant Resolution
	mux.HandleFunc("GET /api/public/academy", academyHandler.GetPublicAcademy)
	mux.HandleFunc("GET /api/public/tenants/resolve", academyHandler.ResolveAcademyByHost)
	mux.HandleFunc("GET /api/public/resolve-domain", academyHandler.ResolveAcademyByHost)
	mux.HandleFunc("GET /api/tenants/{tenantSlug}/courses", publicCourseHandler.ListBySlug)
	mux.HandleFunc("GET /api/public/tenants/{slug}/courses", publicCourseHandler.ListBySlug)
	mux.HandleFunc("GET /api/public/courses", publicCourseHandler.List)
	mux.HandleFunc("GET /api/public/courses/{courseID}", publicCourseHandler.Get)

	// Instructor Course Management Routes
	mux.Handle("POST /api/courses", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.Create))))
	mux.Handle("GET /api/courses", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.List))))
	mux.Handle("GET /api/courses/{courseID}", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.Get))))
	mux.Handle("PUT /api/courses/{courseID}", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.Update))))
	mux.Handle("DELETE /api/courses/{courseID}", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.Delete))))
	mux.Handle("POST /api/courses/{courseID}/sections", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.CreateSection))))
	mux.Handle("GET /api/courses/{courseID}/sections", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.ListSections))))
	mux.Handle("POST /api/courses/{courseID}/sections/{sectionID}/lessons", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.CreateLesson))))
	mux.Handle("GET /api/courses/{courseID}/structure", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.GetStructure))))
	mux.Handle("POST /api/courses/{courseID}/publish", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.Publish))))
	mux.Handle("POST /api/courses/{courseID}/archive", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(courseHandler.Archive))))

	// Video Assets
	mux.Handle("POST /api/video-assets", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(videoAssetHandler.CreateUpload))))
	mux.Handle("POST /api/video-assets/{assetID}/complete", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(videoAssetHandler.CompleteUpload))))
	mux.Handle("PUT /api/video-assets/{assetID}/upload", authMiddleware(instructorAcademyMiddleware(http.HandlerFunc(videoAssetHandler.UploadContent))))
	mux.Handle("GET /api/video-assets/{assetID}", authMiddleware(http.HandlerFunc(videoAssetHandler.GetAsset)))
	mux.Handle("GET /api/video-assets/{assetID}/stream/{filepath...}", authMiddleware(http.HandlerFunc(videoAssetHandler.StreamContent)))
	mux.Handle("GET /api/video-assets/{assetID}/stream", authMiddleware(http.HandlerFunc(videoAssetHandler.StreamContent)))

	mux.HandleFunc("POST /api/uploads/presign", uploadHandler.Presign)
	mux.HandleFunc("POST /api/uploads/{assetID}/complete", uploadHandler.Complete)

	// Student Enrollment & Learning
	mux.Handle("POST /api/courses/{courseID}/enroll", authMiddleware(http.HandlerFunc(enrollmentHandler.Enroll)))
	mux.Handle("GET /api/learn/courses/{courseID}", authMiddleware(http.HandlerFunc(learnHandler.GetCourse)))
	mux.Handle("GET /api/learn/courses/{courseID}/lessons/{lessonID}/video", authMiddleware(http.HandlerFunc(learnHandler.GetVideo)))
	mux.Handle("GET /api/learn/lessons/{lessonID}/progress", authMiddleware(http.HandlerFunc(learnHandler.GetProgress)))
	mux.Handle("PUT /api/learn/lessons/{lessonID}/progress", authMiddleware(http.HandlerFunc(learnHandler.UpdateProgress)))
	mux.Handle("POST /api/learn/lessons/{lessonID}/complete", authMiddleware(http.HandlerFunc(learnHandler.CompleteLesson)))

	corsHandler := httpapi.CORS(cfg.Server.AllowedOrigins)(mux)
	port := cfg.Server.Port

	server := &http.Server{
		Addr:    ":" + port,
		Handler: corsHandler,
	}

	log.Printf("AcademyOS Monolith API running on :%s", port)
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}

	_ = os.Stdout
}