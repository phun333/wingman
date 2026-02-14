package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// ConvexClient handles pushing scraped jobs to Convex.
type ConvexClient struct {
	url        string // Convex HTTP URL (e.g. http://127.0.0.1:3210)
	httpClient *http.Client
}

// NewConvexClient creates a new Convex client.
func NewConvexClient() *ConvexClient {
	url := os.Getenv("CONVEX_URL")
	if url == "" {
		url = "http://127.0.0.1:3210"
	}
	// Strip trailing slash
	url = strings.TrimRight(url, "/")

	return &ConvexClient{
		url:        url,
		httpClient: &http.Client{Timeout: 60 * time.Second},
	}
}

// ConvexJob is the flattened job structure we send to Convex.
// Optional fields use omitempty so nil values are omitted (Convex rejects null).
type ConvexJob struct {
	ExternalID              string   `json:"externalId"`
	Title                   string   `json:"title"`
	Company                 string   `json:"company"`
	ApplyURL                string   `json:"applyUrl"`
	Source                  string   `json:"source"`
	Location                string   `json:"location"`
	WorkplaceType           string   `json:"workplaceType"`
	Countries               []string `json:"countries"`
	SeniorityLevel          *string  `json:"seniorityLevel,omitempty"`
	Commitment              []string `json:"commitment"`
	Category                *string  `json:"category,omitempty"`
	RoleType                *string  `json:"roleType,omitempty"`
	MinYoe                  *float64 `json:"minYoe,omitempty"`
	Skills                  []string `json:"skills"`
	Requirements            *string  `json:"requirements,omitempty"`
	Description             *string  `json:"description,omitempty"`
	SalaryMin               *float64 `json:"salaryMin,omitempty"`
	SalaryMax               *float64 `json:"salaryMax,omitempty"`
	SalaryCurrency          *string  `json:"salaryCurrency,omitempty"`
	SalaryFrequency         *string  `json:"salaryFrequency,omitempty"`
	IsCompensationTransparent bool   `json:"isCompensationTransparent"`
	CompanyLogo             *string  `json:"companyLogo,omitempty"`
	CompanyWebsite          *string  `json:"companyWebsite,omitempty"`
	CompanyLinkedin         *string  `json:"companyLinkedin,omitempty"`
	CompanyIndustry         *string  `json:"companyIndustry,omitempty"`
	CompanySize             *float64 `json:"companySize,omitempty"`
	CompanyTagline          *string  `json:"companyTagline,omitempty"`
	PublishedAt             *float64 `json:"publishedAt,omitempty"`
	ScrapedAt               float64  `json:"scrapedAt"`
	IsExpired               bool     `json:"isExpired"`
}

// TransformJob converts a raw hiring.cafe job into a ConvexJob.
func TransformJob(raw Job) ConvexJob {
	now := float64(time.Now().UnixMilli())

	j := ConvexJob{
		ExternalID:  getString(raw, "id"),
		ApplyURL:    getString(raw, "apply_url"),
		Source:      getString(raw, "source"),
		ScrapedAt:   now,
		IsExpired:   getBool(raw, "is_expired"),
		Skills:      []string{},
		Countries:   []string{},
		Commitment:  []string{},
	}

	// Job info
	if info, ok := raw["job_information"].(map[string]any); ok {
		j.Title = getStringM(info, "title")
		desc := getStringM(info, "description")
		if len(desc) > 10000 {
			desc = desc[:10000] // Truncate huge HTML descriptions
		}
		j.Description = strPtr(desc)
	}

	// Processed job data
	if pjd, ok := raw["v5_processed_job_data"].(map[string]any); ok {
		if j.Title == "" {
			j.Title = getStringM(pjd, "core_job_title")
		}
		j.Company = getStringM(pjd, "company_name")
		j.Location = getStringM(pjd, "formatted_workplace_location")
		j.WorkplaceType = getStringM(pjd, "workplace_type")
		j.SeniorityLevel = strPtrM(pjd, "seniority_level")
		j.Category = strPtrM(pjd, "job_category")
		j.RoleType = strPtrM(pjd, "role_type")
		j.Requirements = strPtrM(pjd, "requirements_summary")
		j.SalaryCurrency = strPtrM(pjd, "listed_compensation_currency")
		j.SalaryFrequency = strPtrM(pjd, "listed_compensation_frequency")
		j.IsCompensationTransparent = getBoolM(pjd, "is_compensation_transparent")

		j.Countries = getStringArrayM(pjd, "workplace_countries")
		j.Commitment = getStringArrayM(pjd, "commitment")
		j.Skills = getStringArrayM(pjd, "technical_tools")

		j.MinYoe = floatPtrM(pjd, "min_industry_and_role_yoe")
		j.SalaryMin = floatPtrM(pjd, "yearly_min_compensation")
		j.SalaryMax = floatPtrM(pjd, "yearly_max_compensation")
		j.PublishedAt = floatPtrM(pjd, "estimated_publish_date_millis")

		// Company info from job data
		j.CompanyIndustry = strPtrM(pjd, "company_sector_and_industry")
		j.CompanyTagline = strPtrM(pjd, "company_tagline")
	}

	// Processed company data
	if pcd, ok := raw["v5_processed_company_data"].(map[string]any); ok {
		if j.Company == "" {
			j.Company = getStringM(pcd, "name")
		}
		j.CompanyLogo = strPtrM(pcd, "image_url")
		j.CompanyWebsite = strPtrM(pcd, "website")
		j.CompanyLinkedin = strPtrM(pcd, "linkedin_url")
		j.CompanySize = floatPtrM(pcd, "num_employees")
		if j.CompanyIndustry == nil {
			// Try from industries array
			if industries := getStringArrayM(pcd, "industries"); len(industries) > 0 {
				j.CompanyIndustry = &industries[0]
			}
		}
		if j.CompanyTagline == nil {
			j.CompanyTagline = strPtrM(pcd, "tagline")
		}
	}

	// Defaults
	if j.Title == "" {
		j.Title = "Untitled"
	}
	if j.Company == "" {
		j.Company = "Unknown"
	}
	if j.WorkplaceType == "" {
		j.WorkplaceType = "Unknown"
	}

	return j
}

// PushToConvex sends a batch of jobs to the Convex bulkUpsert mutation.
// Convex mutations have size limits, so we batch in chunks.
func (c *ConvexClient) PushToConvex(jobs []ConvexJob) error {
	const batchSize = 50 // Convex has payload limits

	total := len(jobs)
	totalInserted := 0
	totalUpdated := 0
	totalSkipped := 0

	for i := 0; i < total; i += batchSize {
		end := i + batchSize
		if end > total {
			end = total
		}
		batch := jobs[i:end]

		log.Printf("📤 Pushing batch %d-%d of %d to Convex...", i+1, end, total)

		result, err := c.callMutation("jobs:bulkUpsert", map[string]any{
			"jobs": batch,
		})
		if err != nil {
			return fmt.Errorf("batch %d-%d failed: %w", i+1, end, err)
		}

		if r, ok := result.(map[string]any); ok {
			ins := int(getFloat(r, "inserted"))
			upd := int(getFloat(r, "updated"))
			skip := int(getFloat(r, "skipped"))
			totalInserted += ins
			totalUpdated += upd
			totalSkipped += skip
			log.Printf("   ✅ inserted=%d updated=%d skipped=%d", ins, upd, skip)
		}

		// Small delay between batches
		if end < total {
			time.Sleep(200 * time.Millisecond)
		}
	}

	log.Printf("📊 Convex sync complete: %d inserted, %d updated, %d skipped (total: %d)",
		totalInserted, totalUpdated, totalSkipped, total)

	return nil
}

// callMutation calls a Convex mutation via the HTTP API.
func (c *ConvexClient) callMutation(path string, args any) (any, error) {
	payload := map[string]any{
		"path":   path,
		"args":   args,
		"format": "json",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal: %w", err)
	}

	url := c.url + "/api/mutation"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http post: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody[:min(len(respBody), 500)]))
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	if errMsg, ok := result["errorMessage"]; ok {
		return nil, fmt.Errorf("convex error: %v", errMsg)
	}

	return result["value"], nil
}

// ─── Helpers ─────────────────────────────────────────────

func getString(m map[string]any, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func getStringM(m map[string]any, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func getBool(m map[string]any, key string) bool {
	if v, ok := m[key].(bool); ok {
		return v
	}
	return false
}

func getBoolM(m map[string]any, key string) bool {
	if v, ok := m[key].(bool); ok {
		return v
	}
	return false
}

func getFloat(m map[string]any, key string) float64 {
	if v, ok := m[key].(float64); ok {
		return v
	}
	return 0
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func strPtrM(m map[string]any, key string) *string {
	if v, ok := m[key].(string); ok && v != "" {
		return &v
	}
	return nil
}

func floatPtrM(m map[string]any, key string) *float64 {
	if v, ok := m[key].(float64); ok {
		return &v
	}
	return nil
}

func getStringArrayM(m map[string]any, key string) []string {
	if arr, ok := m[key].([]any); ok {
		result := make([]string, 0, len(arr))
		for _, item := range arr {
			if s, ok := item.(string); ok {
				result = append(result, s)
			}
		}
		return result
	}
	return []string{}
}
