# hiring.cafe Job Scraper

Go-based job scraper for [hiring.cafe](https://hiring.cafe) using headless Chrome (rod).

Bypasses Vercel bot protection by running a real browser, interacting with the search UI, and passively capturing API responses — the page's own JavaScript handles `x-is-human` token generation naturally.

## How It Works

1. **Launch** headless Chrome via [rod](https://go-rod.github.io/)
2. **Navigate** to hiring.cafe and solve the Vercel security challenge
3. **Search** by typing into the search input and pressing Enter
4. **Capture** the `/api/search-jobs` response via passive network monitoring (no request interception)
5. **Parse** the JSON response and extract job listings

## Build

```bash
cd apps/scraper
go build -o scraper .
```

## Usage

### CLI Mode

```bash
# Search and print to stdout
./scraper -query "Software Engineer"

# Save to file
./scraper -query "Data Scientist" -output jobs.json
```

### Server Mode

```bash
./scraper -serve

# Default port: 3002 (set SCRAPER_PORT env to change)
```

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/search?q=...` | Quick search |
| POST | `/api/search` | Advanced search `{"query":"..."}` |

**Example:**

```bash
# Quick search
curl "http://localhost:3002/api/search?q=Frontend+Developer"

# POST search
curl -X POST http://localhost:3002/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "React Developer"}'
```

### Response Format

```json
{
  "query": "Software Engineer",
  "scraped": 85,
  "jobs": [
    {
      "id": "...",
      "board_token": "...",
      "source": "...",
      "apply_url": "https://...",
      "job_information": {
        "title": "Software Engineer",
        "description": "..."
      },
      "v5_processed_job_data": {
        "core_job_title": "Software Engineer",
        "company_name": "Acme Corp",
        "workplace_type": "Remote",
        "seniority_level": "Mid Level",
        "commitment": ["Full Time"],
        ...
      },
      "v5_processed_company_data": {
        "name": "Acme Corp",
        "website": "acme.com",
        ...
      }
    }
  ]
}
```

## Requirements

- Go 1.21+
- Google Chrome installed (headless mode)

## Architecture

```
apps/scraper/
├── main.go            # CLI + server entrypoint
├── client.go          # Headless browser client (rod)
├── server.go          # HTTP API server
├── models.go          # Data types
├── search_state.go    # Search state builder (unused in UI mode but kept for reference)
└── README.md
```

## Notes

- **15-minute cache** for server mode to avoid hammering hiring.cafe
- **Single browser** instance shared across requests (serialized with mutex)
- Vercel challenge solved automatically on startup (~1-2 seconds)
- Each search captures ~40 results per page (hiring.cafe default)
