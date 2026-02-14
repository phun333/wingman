package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"
)

func main() {
	serve := flag.Bool("serve", false, "Run as HTTP server")
	syncMode := flag.Bool("sync", false, "Scrape all jobs and push to Convex")
	exportMode := flag.Bool("export", false, "Export jobs from Convex to JSONL file")
	seedMode := flag.Bool("seed", false, "Seed jobs from JSONL file into Convex")
	query := flag.String("query", "", "Single search query (CLI mode)")
	output := flag.String("output", "", "Output file path")
	input := flag.String("input", "", "Input JSONL file for seed")
	queries := flag.String("queries", "", "Comma-separated search queries for sync")
	flag.Parse()

	switch {
	case *serve:
		srv := NewServer()
		if err := srv.Start(); err != nil {
			log.Fatalf("Server error: %v", err)
		}

	case *exportMode:
		out := *output
		if out == "" {
			out = "dataset/jobs.jsonl"
		}
		if err := ExportAllFromConvex(out); err != nil {
			log.Fatalf("❌ Export failed: %v", err)
		}

	case *seedMode:
		in := *input
		if in == "" {
			in = "dataset/jobs.jsonl"
		}
		if _, err := os.Stat(in); os.IsNotExist(err) {
			log.Fatalf("❌ File not found: %s", in)
		}
		if err := SeedFromJSONL(in); err != nil {
			log.Fatalf("❌ Seed failed: %v", err)
		}
		log.Println("✅ Seed complete!")

	case *syncMode:
		runSync(*queries, *output)

	case *query != "":
		runSingleQuery(*query, *output)

	default:
		printUsage()
	}
}

func printUsage() {
	fmt.Println("hiring.cafe Job Scraper → Convex")
	fmt.Println("================================")
	fmt.Println()
	fmt.Println("Commands:")
	fmt.Println("  -sync                     Scrape ALL jobs from hiring.cafe → Convex")
	fmt.Println("  -sync -queries \"a,b\"      Scrape specific queries → Convex")
	fmt.Println("  -export [-output f.jsonl]  Export Convex jobs → JSONL (default: dataset/jobs.jsonl)")
	fmt.Println("  -seed   [-input f.jsonl]   Seed JSONL → Convex (default: dataset/jobs.jsonl)")
	fmt.Println("  -query  \"...\"              Single query to stdout or -output file")
	fmt.Println("  -serve                     HTTP API server")
	fmt.Println()
	fmt.Println("Workflow:")
	fmt.Println("  1. scraper -sync                # Scrape hiring.cafe → Convex")
	fmt.Println("  2. scraper -export              # Convex → dataset/jobs.jsonl")
	fmt.Println("  3. git commit dataset/jobs.jsonl # Snapshot in repo")
	fmt.Println("  4. scraper -seed                # New env: dataset/jobs.jsonl → Convex")
	fmt.Println()
	fmt.Println("Environment:")
	fmt.Println("  CONVEX_URL       (default: http://127.0.0.1:3210)")
	fmt.Println("  SCRAPER_PORT     (default: 3002)")
	fmt.Println()
	flag.PrintDefaults()
}

func runSingleQuery(q, output string) {
	log.Printf("🔍 Scraping: '%s'", q)

	client := NewHiringCafeClient()
	defer client.Close()
	if err := client.Init(); err != nil {
		log.Fatalf("❌ Init failed: %v", err)
	}

	result, err := client.SearchJobs(q)
	if err != nil {
		log.Fatalf("❌ Scraping failed: %v", err)
	}
	log.Printf("✅ Found %d jobs", result.Scraped)

	if output != "" {
		writeResultJSON(result, output)
	} else {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		enc.Encode(result)
	}
}

func runSync(queriesStr, output string) {
	client := NewHiringCafeClient()
	defer client.Close()
	if err := client.Init(); err != nil {
		log.Fatalf("❌ Init failed: %v", err)
	}

	var allJobs map[string]Job

	if queriesStr != "" {
		searchQueries := strings.Split(queriesStr, ",")
		for i := range searchQueries {
			searchQueries[i] = strings.TrimSpace(searchQueries[i])
		}

		log.Printf("🚀 SYNC: %d queries", len(searchQueries))
		allJobs = make(map[string]Job)

		for i, q := range searchQueries {
			log.Printf("\n━━━ [%d/%d] '%s' ━━━", i+1, len(searchQueries), q)

			result, err := client.ScrapeAll(q, 100)
			if err != nil {
				log.Printf("⚠️  '%s' failed: %v", q, err)
				continue
			}

			for _, job := range result.Jobs {
				id := getString(job, "id")
				if id == "" {
					id = getString(job, "objectID")
				}
				if id != "" {
					allJobs[id] = job
				}
			}
			log.Printf("   Running total: %d unique", len(allJobs))

			if i < len(searchQueries)-1 {
				time.Sleep(2 * time.Second)
			}
		}
	} else {
		log.Println("🚀 SYNC: scraping ALL jobs (no query)")
		result, err := client.ScrapeAll("", 300)
		if err != nil {
			log.Fatalf("❌ Scrape failed: %v", err)
		}

		allJobs = make(map[string]Job, len(result.Jobs))
		for _, job := range result.Jobs {
			id := getString(job, "id")
			if id == "" {
				id = getString(job, "objectID")
			}
			if id != "" {
				allJobs[id] = job
			}
		}
	}

	log.Printf("\n🎯 Total unique: %d", len(allJobs))

	convexJobs := make([]ConvexJob, 0, len(allJobs))
	for _, raw := range allJobs {
		convexJobs = append(convexJobs, TransformJob(raw))
	}

	if output != "" {
		writeResultJSON(convexJobs, output)
	}

	convexClient := NewConvexClient()
	log.Printf("\n📤 Pushing %d jobs to Convex (%s)...", len(convexJobs), convexClient.url)
	if err := convexClient.PushToConvex(convexJobs); err != nil {
		log.Fatalf("❌ Convex push failed: %v", err)
	}
	log.Println("✅ Sync complete!")
}

func writeResultJSON(data any, path string) {
	f, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Fatalf("JSON marshal error: %v", err)
	}
	if err := os.WriteFile(path, f, 0644); err != nil {
		log.Fatalf("File write error: %v", err)
	}
	log.Printf("📁 Saved to %s", path)
}
