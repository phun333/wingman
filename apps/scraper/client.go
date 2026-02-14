package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/input"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"
)

const hiringCafeURL = "https://hiring.cafe"

// HiringCafeClient uses headless Chrome to interact with hiring.cafe.
type HiringCafeClient struct {
	browser *rod.Browser
	page    *rod.Page
	ready   bool
}

func NewHiringCafeClient() *HiringCafeClient {
	return &HiringCafeClient{}
}

// Init launches Chrome, navigates to hiring.cafe, solves the Vercel challenge.
func (c *HiringCafeClient) Init() error {
	log.Println("🚀 Launching headless browser...")

	path, _ := launcher.LookPath()
	if path == "" {
		path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
	}

	u := launcher.New().
		Bin(path).
		Headless(true).
		Set("disable-blink-features", "AutomationControlled").
		MustLaunch()

	c.browser = rod.New().ControlURL(u).MustConnect()
	c.page = c.browser.MustPage("")

	c.page.MustSetUserAgent(&proto.NetworkSetUserAgentOverride{
		UserAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	})

	log.Println("🌐 Navigating to hiring.cafe...")
	if err := c.page.Navigate(hiringCafeURL); err != nil {
		return fmt.Errorf("navigate: %w", err)
	}

	log.Println("⏳ Solving Vercel challenge...")
	solved := false
	for i := 0; i < 30; i++ {
		time.Sleep(1 * time.Second)
		title, err := c.page.Eval(`() => document.title`)
		if err == nil {
			t := title.Value.Str()
			if !strings.Contains(strings.ToLower(t), "vercel") &&
				!strings.Contains(strings.ToLower(t), "security") &&
				!strings.Contains(strings.ToLower(t), "checkpoint") &&
				t != "" {
				solved = true
				log.Printf("   ✅ Title: %s", t)
				break
			}
		}
	}
	if !solved {
		return fmt.Errorf("vercel challenge not solved within 30s")
	}

	c.page.MustWaitLoad()
	time.Sleep(5 * time.Second) // JS + x-is-human token init

	c.ready = true
	log.Println("✅ Ready!")
	return nil
}

func (c *HiringCafeClient) Close() {
	if c.browser != nil {
		c.browser.MustClose()
	}
}

// ─── Network capture helper ─────────────────────────────

type networkCapture struct {
	mu              sync.Mutex
	pendingMu       sync.Mutex
	pendingRequests map[proto.NetworkRequestID]string
	bodies          []string
	gotResult       chan struct{}
	page            *rod.Page
}

func newNetworkCapture(page *rod.Page) *networkCapture {
	_ = proto.NetworkEnable{}.Call(page)
	return &networkCapture{
		pendingRequests: make(map[proto.NetworkRequestID]string),
		gotResult:       make(chan struct{}, 100),
		page:            page,
	}
}

func (nc *networkCapture) start() {
	go nc.page.EachEvent(
		func(e *proto.NetworkResponseReceived) bool {
			url := e.Response.URL
			if strings.Contains(url, "/api/search-jobs") &&
				!strings.Contains(url, "get-total-count") &&
				e.Response.Status == 200 {
				nc.pendingMu.Lock()
				nc.pendingRequests[e.RequestID] = url
				nc.pendingMu.Unlock()
			}
			return false
		},
		func(e *proto.NetworkLoadingFinished) bool {
			nc.pendingMu.Lock()
			url, ok := nc.pendingRequests[e.RequestID]
			delete(nc.pendingRequests, e.RequestID)
			nc.pendingMu.Unlock()
			if !ok {
				return false
			}

			bodyResult, err := proto.NetworkGetResponseBody{
				RequestID: e.RequestID,
			}.Call(nc.page)
			if err != nil {
				return false
			}

			bodyStr := bodyResult.Body
			if bodyResult.Base64Encoded {
				if decoded, err := base64.StdEncoding.DecodeString(bodyResult.Body); err == nil {
					bodyStr = string(decoded)
				}
			}

			log.Printf("📦 Captured: %s (%d bytes)", truncateURL(url), len(bodyStr))

			nc.mu.Lock()
			nc.bodies = append(nc.bodies, bodyStr)
			nc.mu.Unlock()

			select {
			case nc.gotResult <- struct{}{}:
			default:
			}
			return false
		},
	)()
}

func (nc *networkCapture) waitForResult(timeout time.Duration) bool {
	select {
	case <-nc.gotResult:
		return true
	case <-time.After(timeout):
		return false
	}
}

func (nc *networkCapture) collectJobs() []Job {
	nc.mu.Lock()
	defer nc.mu.Unlock()
	var all []Job
	for _, body := range nc.bodies {
		if jobs, err := extractJobs(body); err == nil {
			all = append(all, jobs...)
		}
	}
	return all
}

func (nc *networkCapture) bodyCount() int {
	nc.mu.Lock()
	defer nc.mu.Unlock()
	return len(nc.bodies)
}

// drainNew returns jobs from bodies captured since lastIndex, updating lastIndex.
func (nc *networkCapture) drainNew(lastIndex *int) []Job {
	nc.mu.Lock()
	defer nc.mu.Unlock()
	var newJobs []Job
	for i := *lastIndex; i < len(nc.bodies); i++ {
		if jobs, err := extractJobs(nc.bodies[i]); err == nil {
			newJobs = append(newJobs, jobs...)
		}
	}
	*lastIndex = len(nc.bodies)
	return newJobs
}

// ─── Search (single query, single page) ──────────────────

func (c *HiringCafeClient) SearchJobs(query string) (*ScrapeResult, error) {
	if !c.ready {
		return nil, fmt.Errorf("client not initialized")
	}

	nc := newNetworkCapture(c.page)
	nc.start()
	time.Sleep(300 * time.Millisecond)

	if err := c.performSearch(query); err != nil {
		return nil, err
	}

	log.Println("⏳ Waiting for results...")
	if !nc.waitForResult(45 * time.Second) {
		return nil, fmt.Errorf("timeout (45s)")
	}
	time.Sleep(2 * time.Second)

	jobs := nc.collectJobs()
	log.Printf("📊 Got %d jobs for '%s'", len(jobs), query)

	return &ScrapeResult{
		Query:   query,
		Scraped: len(jobs),
		Jobs:    jobs,
	}, nil
}

// ─── ScrapeAll: query + scroll pagination to get EVERYTHING ─

func (c *HiringCafeClient) ScrapeAll(query string, maxScrolls int) (*ScrapeResult, error) {
	if !c.ready {
		return nil, fmt.Errorf("client not initialized")
	}
	if maxScrolls <= 0 {
		maxScrolls = 200 // ~200 * 40 = 8000 jobs max
	}

	nc := newNetworkCapture(c.page)
	nc.start()
	time.Sleep(300 * time.Millisecond)

	// Step 1: Perform the search (or clear for empty query)
	if query != "" {
		if err := c.performSearch(query); err != nil {
			return nil, err
		}
	} else {
		log.Println("🔍 Browsing ALL jobs (no query filter)...")
		if err := c.clearSearchAndBrowse(); err != nil {
			return nil, err
		}
	}

	// Step 2: Wait for the first page
	log.Println("⏳ Waiting for first page...")
	if !nc.waitForResult(45 * time.Second) {
		return nil, fmt.Errorf("timeout waiting for first page")
	}
	time.Sleep(2 * time.Second)

	// Step 3: Scroll pagination — keep scrolling until no new results
	allJobs := make(map[string]Job) // dedup by ID
	lastBodyIndex := 0
	emptyScrolls := 0

	// Collect initial page
	for _, j := range nc.drainNew(&lastBodyIndex) {
		id := jobID(j)
		if id != "" {
			allJobs[id] = j
		}
	}
	log.Printf("   Page 0: %d unique jobs", len(allJobs))

	for scroll := 1; scroll <= maxScrolls; scroll++ {
		prevCount := len(allJobs)

		// Scroll to bottom
		c.page.Eval(`() => window.scrollTo(0, document.body.scrollHeight)`)

		// Wait for new API response or timeout
		got := nc.waitForResult(8 * time.Second)

		if got {
			time.Sleep(1 * time.Second) // let extra responses arrive
		}

		// Collect new jobs
		for _, j := range nc.drainNew(&lastBodyIndex) {
			id := jobID(j)
			if id != "" {
				allJobs[id] = j
			}
		}

		newCount := len(allJobs) - prevCount
		log.Printf("   Scroll %d: +%d new (total: %d unique)", scroll, newCount, len(allJobs))

		if newCount == 0 {
			emptyScrolls++
			if emptyScrolls >= 3 {
				log.Println("   ✅ No more results after 3 empty scrolls — done!")
				break
			}
		} else {
			emptyScrolls = 0
		}

		// Small delay between scrolls
		time.Sleep(500 * time.Millisecond)
	}

	// Convert map to slice
	jobs := make([]Job, 0, len(allJobs))
	for _, j := range allJobs {
		jobs = append(jobs, j)
	}

	log.Printf("📊 Total unique jobs: %d", len(jobs))

	return &ScrapeResult{
		Query:   query,
		Scraped: len(jobs),
		Jobs:    jobs,
	}, nil
}

// clearSearchAndBrowse clears the search box and triggers default browsing.
func (c *HiringCafeClient) clearSearchAndBrowse() error {
	searchInput, err := c.page.Timeout(5 * time.Second).Element(`#query-search-v4`)
	if err != nil {
		return fmt.Errorf("could not find search input: %w", err)
	}

	// Clear any existing text
	searchInput.MustClick()
	time.Sleep(200 * time.Millisecond)
	searchInput.MustSelectAllText()
	searchInput.MustType(input.Backspace)
	time.Sleep(200 * time.Millisecond)

	// Press Enter to trigger default listing
	searchInput.MustType(input.Enter)
	return nil
}

// performSearch types a query and presses Enter.
func (c *HiringCafeClient) performSearch(query string) error {
	searchInput, err := c.page.Timeout(5 * time.Second).Element(`#query-search-v4`)
	if err != nil {
		// Fallback
		for _, sel := range []string{`input[placeholder*="Search"]`, `input[type="search"]`} {
			if el, e := c.page.Timeout(2 * time.Second).Element(sel); e == nil {
				searchInput = el
				break
			}
		}
	}
	if searchInput == nil {
		return fmt.Errorf("could not find search input")
	}

	searchInput.MustClick()
	time.Sleep(200 * time.Millisecond)
	searchInput.MustSelectAllText()
	searchInput.MustType(input.Backspace)
	time.Sleep(200 * time.Millisecond)

	log.Printf("   Typing: '%s'", query)
	searchInput.MustInput(query)
	time.Sleep(500 * time.Millisecond)

	searchInput.MustType(input.Enter)
	return nil
}

// ─── Helpers ─────────────────────────────────────────────

func jobID(j Job) string {
	if id, ok := j["id"].(string); ok && id != "" {
		return id
	}
	if id, ok := j["objectID"].(string); ok && id != "" {
		return id
	}
	return ""
}

func truncateURL(url string) string {
	if idx := strings.Index(url, "?s="); idx != -1 {
		return url[:idx] + "?s=<state>&..."
	}
	if len(url) > 100 {
		return url[:100] + "..."
	}
	return url
}

func extractJobs(body string) ([]Job, error) {
	raw := []byte(body)

	if decoded, err := base64.StdEncoding.DecodeString(body); err == nil && len(decoded) > 0 {
		if decoded[0] == '{' || decoded[0] == '[' {
			raw = decoded
		}
	}

	var structured JobsResponse
	if err := json.Unmarshal(raw, &structured); err == nil {
		for _, list := range [][]Job{
			structured.Results, structured.Jobs, structured.Data,
			structured.Items, structured.Content,
		} {
			if len(list) > 0 {
				return list, nil
			}
		}
		if structured.Hits != nil && len(structured.Hits.Hits) > 0 {
			jobs := make([]Job, 0, len(structured.Hits.Hits))
			for _, hit := range structured.Hits.Hits {
				if hit.Source != nil {
					jobs = append(jobs, hit.Source)
				}
			}
			if len(jobs) > 0 {
				return jobs, nil
			}
		}
	}

	var directList []Job
	if err := json.Unmarshal(raw, &directList); err == nil && len(directList) > 0 {
		return directList, nil
	}

	preview := body
	if len(preview) > 200 {
		preview = preview[:200]
	}
	return nil, fmt.Errorf("could not extract jobs: %s", preview)
}
