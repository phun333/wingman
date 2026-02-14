package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

// CacheEntry holds cached scrape results.
type CacheEntry struct {
	Result   *ScrapeResult
	CachedAt time.Time
}

// Server provides an HTTP API for searching hiring.cafe jobs.
type Server struct {
	client   *HiringCafeClient
	mu       sync.Mutex // serialize scrape requests (single browser)
	cache    map[string]*CacheEntry
	cacheMu  sync.RWMutex
	cacheTTL time.Duration
}

func NewServer() *Server {
	return &Server{
		client:   NewHiringCafeClient(),
		cache:    make(map[string]*CacheEntry),
		cacheTTL: 15 * time.Minute,
	}
}

func httpJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func httpError(w http.ResponseWriter, status int, msg string) {
	httpJSON(w, status, ErrorResponse{Error: http.StatusText(status), Message: msg})
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	httpJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Server) doSearch(query string) (*ScrapeResult, error) {
	// Check cache
	s.cacheMu.RLock()
	entry, cached := s.cache[query]
	s.cacheMu.RUnlock()

	if cached && time.Since(entry.CachedAt) < s.cacheTTL {
		log.Printf("💾 Cache hit for '%s'", query)
		return entry.Result, nil
	}

	// Scrape (serialized — single browser)
	s.mu.Lock()
	defer s.mu.Unlock()

	result, err := s.client.SearchJobs(query)
	if err != nil {
		return nil, err
	}

	// Update cache
	s.cacheMu.Lock()
	s.cache[query] = &CacheEntry{Result: result, CachedAt: time.Now()}
	s.cacheMu.Unlock()

	return result, nil
}

func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {
	var query string

	switch r.Method {
	case http.MethodGet:
		query = r.URL.Query().Get("q")
	case http.MethodPost:
		var req SearchRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			httpError(w, http.StatusBadRequest, "Invalid JSON: "+err.Error())
			return
		}
		query = req.Query
	default:
		httpError(w, http.StatusMethodNotAllowed, "Use GET or POST")
		return
	}

	if query == "" {
		httpError(w, http.StatusBadRequest, "query is required (GET: ?q=..., POST: {\"query\":\"...\"})")
		return
	}

	result, err := s.doSearch(query)
	if err != nil {
		httpError(w, http.StatusInternalServerError, "Scraping failed: "+err.Error())
		return
	}

	httpJSON(w, http.StatusOK, result)
}

// Start initializes the browser and runs the HTTP server.
func (s *Server) Start() error {
	if err := s.client.Init(); err != nil {
		return err
	}
	defer s.client.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/api/search", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		s.handleSearch(w, r)
	})

	port := os.Getenv("SCRAPER_PORT")
	if port == "" {
		port = "3002"
	}

	handler := cors(mux)

	log.Printf("🚀 Hiring.cafe scraper server on :%s", port)
	log.Printf("   GET  /health          - Health check")
	log.Printf("   GET  /api/search?q=.. - Search jobs")
	log.Printf("   POST /api/search      - Search jobs {\"query\":\"...\"}")

	return http.ListenAndServe(":"+port, handler)
}
