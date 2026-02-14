package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

// ExportFromConvex exports all jobs from Convex DB to a JSONL file.
func ExportFromConvex(outputPath string) error {
	convex := NewConvexClient()
	log.Printf("📥 Exporting jobs from Convex (%s)...", convex.url)

	// Fetch all jobs via the list query (no filter = all jobs)
	// We'll paginate with large limit
	var allJobs []map[string]any
	batchSize := 500

	for {
		payload := map[string]any{
			"path": "jobs:list",
			"args": map[string]any{
				"limit": batchSize,
			},
			"format": "json",
		}

		body, err := json.Marshal(payload)
		if err != nil {
			return fmt.Errorf("marshal: %w", err)
		}

		resp, err := http.Post(convex.url+"/api/query", "application/json",
			io.NopCloser(jsonReader(body)))
		if err != nil {
			return fmt.Errorf("query: %w", err)
		}

		var result struct {
			Status string `json:"status"`
			Value  struct {
				Jobs    []map[string]any `json:"jobs"`
				HasMore bool             `json:"hasMore"`
			} `json:"value"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			resp.Body.Close()
			return fmt.Errorf("decode: %w", err)
		}
		resp.Body.Close()

		if result.Status != "success" {
			return fmt.Errorf("query failed: %s", result.Status)
		}

		allJobs = append(allJobs, result.Value.Jobs...)
		log.Printf("   Fetched %d jobs so far...", len(allJobs))

		if !result.Value.HasMore || len(result.Value.Jobs) == 0 {
			break
		}

		// Convex list query doesn't support cursor-based pagination via HTTP easily,
		// so we'll fetch all at once with a large limit
		break
	}

	// Write as JSONL
	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}
	defer f.Close()

	w := bufio.NewWriter(f)
	for _, job := range allJobs {
		// Remove Convex internal fields for clean export
		delete(job, "_id")
		delete(job, "_creationTime")

		line, err := json.Marshal(job)
		if err != nil {
			continue
		}
		w.Write(line)
		w.WriteByte('\n')
	}
	w.Flush()

	log.Printf("✅ Exported %d jobs to %s", len(allJobs), outputPath)
	return nil
}

// ExportAllFromConvex exports ALL jobs by fetching in large batches directly.
// Uses a raw approach since Convex list has limitations.
func ExportAllFromConvex(outputPath string) error {
	convex := NewConvexClient()
	log.Printf("📥 Exporting ALL jobs from Convex (%s)...", convex.url)

	// Use a very large limit to get everything
	payload := map[string]any{
		"path": "jobs:listAll",
		"args": map[string]any{},
		"format": "json",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	resp, err := http.Post(convex.url+"/api/query", "application/json",
		io.NopCloser(jsonReader(body)))
	if err != nil {
		return fmt.Errorf("query: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Status       string           `json:"status"`
		Value        []map[string]any `json:"value"`
		ErrorMessage string           `json:"errorMessage"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("decode: %w", err)
	}

	if result.Status != "success" {
		return fmt.Errorf("query failed: %s", result.ErrorMessage)
	}

	// Write as JSONL
	f, err := os.Create(outputPath)
	if err != nil {
		return fmt.Errorf("create file: %w", err)
	}
	defer f.Close()

	w := bufio.NewWriter(f)
	for _, job := range result.Value {
		delete(job, "_id")
		delete(job, "_creationTime")

		line, err := json.Marshal(job)
		if err != nil {
			continue
		}
		w.Write(line)
		w.WriteByte('\n')
	}
	w.Flush()

	log.Printf("✅ Exported %d jobs to %s", len(result.Value), outputPath)
	return nil
}

func jsonReader(data []byte) io.Reader {
	return io.NopCloser(bytesReader(data))
}

type bytesReaderType struct {
	data []byte
	pos  int
}

func bytesReader(data []byte) *bytesReaderType {
	return &bytesReaderType{data: data}
}

func (r *bytesReaderType) Read(p []byte) (n int, err error) {
	if r.pos >= len(r.data) {
		return 0, io.EOF
	}
	n = copy(p, r.data[r.pos:])
	r.pos += n
	return n, nil
}

func (r *bytesReaderType) Close() error { return nil }

// SeedFromJSONL reads a JSONL file and pushes jobs to Convex via bulkUpsert.
func SeedFromJSONL(inputPath string) error {
	f, err := os.Open(inputPath)
	if err != nil {
		return fmt.Errorf("open: %w", err)
	}
	defer f.Close()

	var jobs []ConvexJob
	scanner := bufio.NewScanner(f)
	// Increase buffer size for large lines
	scanner.Buffer(make([]byte, 0, 1024*1024), 1024*1024)

	for scanner.Scan() {
		var job ConvexJob
		if err := json.Unmarshal(scanner.Bytes(), &job); err != nil {
			log.Printf("⚠️  Skip bad line: %v", err)
			continue
		}
		jobs = append(jobs, job)
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("scan: %w", err)
	}

	log.Printf("📂 Loaded %d jobs from %s", len(jobs), inputPath)

	// Set scrapedAt to now for all
	now := float64(time.Now().UnixMilli())
	for i := range jobs {
		jobs[i].ScrapedAt = now
	}

	convex := NewConvexClient()
	log.Printf("📤 Seeding %d jobs to Convex (%s)...", len(jobs), convex.url)
	return convex.PushToConvex(jobs)
}
