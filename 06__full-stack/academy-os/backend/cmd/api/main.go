package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/ShaharyarShakir/academy-os/internal/auth"
	"github.com/ShaharyarShakir/academy-os/internal/cache"
	"github.com/ShaharyarShakir/academy-os/internal/config"
	"github.com/ShaharyarShakir/academy-os/internal/course"
	"github.com/ShaharyarShakir/academy-os/internal/database"
	httpapi "github.com/ShaharyarShakir/academy-os/internal/http"
	"github.com/ShaharyarShakir/academy-os/internal/jobs"
	"github.com/ShaharyarShakir/academy-os/internal/storage"
	"github.com/ShaharyarShakir/academy-os/internal/tenant"
	"github.com/ShaharyarShakir/academy-os/internal/video"
	"github.com/joho/godotenv"
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

	tenantRepo := database.NewTenantRepository(db)
	assetRepo := database.NewAssetRepository(db)
	userRepo := database.NewUserRepository(db)
	sessionRepo := database.NewSessionRepository(db)
	membershipRepo := database.NewMembershipRepository(db)
	courseRepo := database.NewCourseRepository(db)
	sectionRepo := database.NewSectionRepository(db)
	lessonRepo := database.NewLessonRepository(db)
	enrollmentRepo := database.NewEnrollmentRepository(db)
	progressRepo := database.NewLessonProgressRepository(db)

	courseService := course.NewService(courseRepo, sectionRepo, lessonRepo)
	publisher := course.NewPublisher(courseRepo, sectionRepo, lessonRepo)

	jobQueue := jobs.NewQueue(redis)
	uploadHandler := httpapi.NewUploadHandler(s3Service, assetRepo, jobQueue)
	authHandler := httpapi.NewAuthHandler(userRepo, sessionRepo)
	tenantHandler := httpapi.NewTenantHandler(tenantRepo, membershipRepo)
	courseHandler := httpapi.NewCourseHandler(courseService, publisher)
	publicCourseHandler := httpapi.NewPublicCourseHandler(tenantRepo, courseRepo, sectionRepo, lessonRepo, enrollmentRepo, sessionRepo)
	enrollmentHandler := httpapi.NewEnrollmentHandler(courseRepo, enrollmentRepo)
	learnHandler := httpapi.NewLearnHandler(courseRepo, sectionRepo, lessonRepo, assetRepo, enrollmentRepo, progressRepo, s3Service)

	videoService := video.NewService(
		assetRepo,
		courseRepo,
		sectionRepo,
		lessonRepo,
		s3Service,
		jobQueue,
	)
	videoAssetHandler := httpapi.NewVideoAssetHandler(videoService)

	authMiddleware := httpapi.WithAuth(sessionRepo)
	tenantMiddleware := httpapi.WithTenant(membershipRepo)

	tenantResolverService := tenant.NewService(membershipRepo)
	tenantResolverMW := tenant.NewMiddleware(tenantResolverService)

	mux := http.NewServeMux()

	// Process Liveness Check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(HealthResponse{
			Status: "ok",
		})
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

	mux.HandleFunc("POST /api/auth/signup", authHandler.Signup)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("POST /api/auth/logout", authHandler.Logout)
	mux.HandleFunc("GET /api/auth/me", authHandler.Me)
	mux.Handle("GET /api/me/tenants", authMiddleware(http.HandlerFunc(tenantHandler.MeTenants)))
	mux.Handle("GET /api/tenants", authMiddleware(http.HandlerFunc(tenantHandler.List)))
	mux.Handle("POST /api/tenants", authMiddleware(http.HandlerFunc(tenantHandler.Create)))
	mux.Handle("GET /api/academies", authMiddleware(http.HandlerFunc(tenantHandler.List)))
	mux.Handle("POST /api/academies", authMiddleware(http.HandlerFunc(tenantHandler.Create)))

	mux.Handle("GET /api/tenants/current", authMiddleware(tenantMiddleware(http.HandlerFunc(tenantHandler.Current))))
	mux.Handle("GET /api/academy", authMiddleware(tenantMiddleware(http.HandlerFunc(tenantHandler.GetAcademy))))
	mux.Handle("PATCH /api/academy", authMiddleware(tenantMiddleware(http.HandlerFunc(tenantHandler.UpdateBranding))))
	mux.HandleFunc("GET /api/tenants/{tenantSlug}/courses", publicCourseHandler.ListBySlug)
	mux.HandleFunc("GET /api/public/tenants/resolve", tenantHandler.ResolveTenantByHost)
	mux.HandleFunc("GET /api/public/resolve-domain", tenantHandler.ResolveTenantByHost)

	// Academy-Scoped API Routes (Phase 2F)
	mux.Handle("POST /api/academies/{academyID}/courses", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.Create))))
	mux.Handle("GET /api/academies/{academyID}/courses", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.List))))
	mux.Handle("GET /api/academies/{academyID}/courses/{courseID}", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.Get))))
	mux.Handle("PUT /api/academies/{academyID}/courses/{courseID}", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.Update))))
	mux.Handle("DELETE /api/academies/{academyID}/courses/{courseID}", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.Delete))))
	mux.Handle("POST /api/academies/{academyID}/courses/{courseID}/sections", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.CreateSection))))
	mux.Handle("GET /api/academies/{academyID}/courses/{courseID}/sections", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.ListSections))))
	mux.Handle("POST /api/academies/{academyID}/courses/{courseID}/sections/{sectionID}/lessons", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.CreateLesson))))
	mux.Handle("GET /api/academies/{academyID}/courses/{courseID}/structure", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.GetStructure))))
	mux.Handle("POST /api/academies/{academyID}/courses/{courseID}/publish", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.Publish))))
	mux.Handle("POST /api/academies/{academyID}/courses/{courseID}/archive", authMiddleware(tenantResolverMW.RequireAcademy(http.HandlerFunc(courseHandler.Archive))))


	mux.Handle(
		"POST /api/courses",
		authMiddleware(
			tenantMiddleware(
				httpapi.RequireRoles(
					auth.RoleOwner,
					auth.RoleInstructor,
				)(
					http.HandlerFunc(
						courseHandler.Create,
					),
				),
			),
		),
	)

	mux.Handle(
		"GET /api/courses",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(
					courseHandler.List,
				),
			),
		),
	)

	mux.Handle(
		"GET /api/courses/{courseID}",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(
					courseHandler.Get,
				),
			),
		),
	)

	mux.Handle(
		"PUT /api/courses/{courseID}",
		authMiddleware(
			tenantMiddleware(
				httpapi.RequireRoles(
					auth.RoleOwner,
					auth.RoleInstructor,
				)(
					http.HandlerFunc(
						courseHandler.Update,
					),
				),
			),
		),
	)

	mux.Handle(
		"DELETE /api/courses/{courseID}",
		authMiddleware(
			tenantMiddleware(
				httpapi.RequireRoles(
					auth.RoleOwner,
					auth.RoleInstructor,
				)(
					http.HandlerFunc(
						courseHandler.Delete,
					),
				),
			),
		),
	)

	mux.Handle(
		"POST /api/courses/{courseID}/sections",
		authMiddleware(
			tenantMiddleware(
				httpapi.RequireRoles(
					auth.RoleOwner,
					auth.RoleInstructor,
				)(
					http.HandlerFunc(
						courseHandler.CreateSection,
					),
				),
			),
		),
	)

	mux.Handle(
		"GET /api/courses/{courseID}/sections",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(
					courseHandler.ListSections,
				),
			),
		),
	)

	mux.Handle(
		"POST /api/courses/{courseID}/sections/{sectionID}/lessons",
		authMiddleware(
			tenantMiddleware(
				httpapi.RequireRoles(
					auth.RoleOwner,
					auth.RoleInstructor,
				)(
					http.HandlerFunc(
						courseHandler.CreateLesson,
					),
				),
			),
		),
	)

	mux.Handle(
		"GET /api/courses/{courseID}/structure",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(
					courseHandler.GetStructure,
				),
			),
		),
	)

	mux.Handle(
		"POST /api/courses/{courseID}/publish",
		authMiddleware(
			tenantMiddleware(
				httpapi.RequireRoles(
					auth.RoleOwner,
					auth.RoleInstructor,
				)(
					http.HandlerFunc(
						courseHandler.Publish,
					),
				),
			),
		),
	)

	mux.Handle(
		"POST /api/courses/{courseID}/archive",
		authMiddleware(
			tenantMiddleware(
				httpapi.RequireRoles(
					auth.RoleOwner,
					auth.RoleInstructor,
				)(
					http.HandlerFunc(
						courseHandler.Archive,
					),
				),
			),
		),
	)

	mux.Handle(
		"POST /api/video-assets",
		authMiddleware(
			tenantMiddleware(
				httpapi.RequireRoles(
					auth.RoleOwner,
					auth.RoleInstructor,
				)(
					http.HandlerFunc(
						videoAssetHandler.CreateUpload,
					),
				),
			),
		),
	)

	mux.Handle(
		"POST /api/video-assets/{assetID}/complete",
		authMiddleware(
			tenantMiddleware(
				httpapi.RequireRoles(
					auth.RoleOwner,
					auth.RoleInstructor,
				)(
					http.HandlerFunc(
						videoAssetHandler.CompleteUpload,
					),
				),
			),
		),
	)

	mux.Handle(
		"GET /api/video-assets/{assetID}",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(
					videoAssetHandler.GetAsset,
				),
			),
		),
	)

	mux.HandleFunc("POST /api/uploads/presign", uploadHandler.Presign)
	mux.HandleFunc("POST /api/uploads/{assetID}/complete", uploadHandler.Complete)

	// Public Course Catalog & Details
	mux.HandleFunc("GET /api/public/tenants/{slug}/courses", publicCourseHandler.ListBySlug)
	mux.HandleFunc("GET /api/public/courses", publicCourseHandler.List)
	mux.HandleFunc("GET /api/public/courses/{courseID}", publicCourseHandler.Get)

	// Enrollment
	mux.Handle(
		"POST /api/courses/{courseID}/enroll",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(enrollmentHandler.Enroll),
			),
		),
	)

	// Student Learning & Video Access
	mux.Handle(
		"GET /api/learn/courses/{courseID}",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(learnHandler.GetCourse),
			),
		),
	)

	mux.Handle(
		"GET /api/learn/courses/{courseID}/lessons/{lessonID}/video",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(learnHandler.GetVideo),
			),
		),
	)

	// Progress Tracking
	mux.Handle(
		"GET /api/learn/lessons/{lessonID}/progress",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(learnHandler.GetProgress),
			),
		),
	)

	mux.Handle(
		"PUT /api/learn/lessons/{lessonID}/progress",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(learnHandler.UpdateProgress),
			),
		),
	)

	mux.Handle(
		"POST /api/learn/lessons/{lessonID}/complete",
		authMiddleware(
			tenantMiddleware(
				http.HandlerFunc(learnHandler.CompleteLesson),
			),
		),
	)

	corsHandler := httpapi.CORS(cfg.Server.AllowedOrigins)(mux)

	port := cfg.Server.Port

	server := &http.Server{
		Addr:    ":" + port,
		Handler: corsHandler,
	}

	log.Printf("AcademyOS API listening on :%s", port)

	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}

	_ = os.Stdout
}