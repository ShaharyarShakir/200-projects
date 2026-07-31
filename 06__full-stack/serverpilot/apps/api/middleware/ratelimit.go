package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/ShaharyarShakir/serverpilot/apps/api/responses"
)

type clientLimit struct {
	tokens   float64
	lastSeen time.Time
}

// RateLimiter manages in-memory rate limits using the token-bucket algorithm.
type RateLimiter struct {
	mu       sync.Mutex
	clients  map[string]*clientLimit
	rate     float64       // rate of token refill per second
	capacity float64       // maximum token burst capacity
	interval time.Duration // cleanup interval
}

// NewRateLimiter creates a new thread-safe RateLimiter instance.
func NewRateLimiter(rate, capacity float64, cleanupInterval time.Duration) *RateLimiter {
	limiter := &RateLimiter{
		clients:  make(map[string]*clientLimit),
		rate:     rate,
		capacity: capacity,
		interval: cleanupInterval,
	}

	go limiter.cleanupLoop()

	return limiter
}

// Limit returns a middleware that limits requests per IP.
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := rl.getClientIP(r)

		rl.mu.Lock()
		client, exists := rl.clients[ip]
		now := time.Now()

		if !exists {
			client = &clientLimit{
				tokens:   rl.capacity,
				lastSeen: now,
			}
			rl.clients[ip] = client
		}

		// Refill tokens based on time elapsed
		elapsed := now.Sub(client.lastSeen).Seconds()
		client.lastSeen = now
		client.tokens += elapsed * rl.rate
		if client.tokens > rl.capacity {
			client.tokens = rl.capacity
		}

		// Check if we have at least one token available
		if client.tokens >= 1.0 {
			client.tokens -= 1.0
			rl.mu.Unlock()
			next.ServeHTTP(w, r)
		} else {
			rl.mu.Unlock()
			w.Header().Set("Retry-After", "1")
			responses.RateLimited(w, "Rate limit exceeded. Please try again later.")
		}
	})
}

func (rl *RateLimiter) getClientIP(r *http.Request) string {
	// First check X-Forwarded-For
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			ip := strings.TrimSpace(parts[0])
			if ip != "" {
				return ip
			}
		}
	}

	// Fallback to RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

func (rl *RateLimiter) cleanupLoop() {
	ticker := time.NewTicker(rl.interval)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for ip, client := range rl.clients {
			// If client hasn't made a request in 1 hour, clean it up
			if now.Sub(client.lastSeen) > 1*time.Hour {
				delete(rl.clients, ip)
			}
		}
		rl.mu.Unlock()
	}
}
