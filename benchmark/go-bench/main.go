package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

var (
	FAL_KEY            string
	TTS_ENDPOINT       string
	STT_ENDPOINT       string
	OPENROUTER_API_KEY string
	SITE_URL           string
)

func loadEnv() {
	dir, _ := os.Getwd()
	for {
		envPath := filepath.Join(dir, ".env")
		if data, err := os.ReadFile(envPath); err == nil {
			for _, line := range strings.Split(string(data), "\n") {
				line = strings.TrimSpace(line)
				if line == "" || strings.HasPrefix(line, "#") {
					continue
				}
				idx := strings.Index(line, "=")
				if idx < 0 {
					continue
				}
				key := strings.TrimSpace(line[:idx])
				val := strings.TrimSpace(line[idx+1:])
				if os.Getenv(key) == "" {
					os.Setenv(key, val)
				}
			}
			break
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	FAL_KEY = os.Getenv("FAL_KEY")
	TTS_ENDPOINT = os.Getenv("TTS_ENDPOINT")
	if TTS_ENDPOINT == "" {
		TTS_ENDPOINT = "freya-mypsdi253hbk/freya-tts"
	}
	STT_ENDPOINT = os.Getenv("STT_ENDPOINT")
	if STT_ENDPOINT == "" {
		STT_ENDPOINT = "freya-mypsdi253hbk/freya-stt"
	}
	OPENROUTER_API_KEY = os.Getenv("OPENROUTER_API_KEY")
	SITE_URL = os.Getenv("SITE_URL")
	if SITE_URL == "" {
		SITE_URL = "http://localhost:3000"
	}
}

type Result struct {
	Label string
	TTFB  time.Duration
	Total time.Duration
	Extra map[string]any
}

func fmtDur(d time.Duration) string {
	if d < 0 {
		return "ERROR"
	}
	if d < time.Second {
		return fmt.Sprintf("%dms", d.Milliseconds())
	}
	return fmt.Sprintf("%.2fs", d.Seconds())
}

func printResults(title string, results []Result) {
	fmt.Printf("\n%s\n  %s\n%s\n", strings.Repeat("=", 60), title, strings.Repeat("=", 60))
	sort.Slice(results, func(i, j int) bool {
		return results[i].Total < results[j].Total
	})
	medals := []string{"🥇", "🥈", "🥉"}
	for i, r := range results {
		medal := "  "
		if i < len(medals) {
			medal = medals[i]
		}
		barLen := int(r.Total.Milliseconds() / 50)
		if barLen > 40 {
			barLen = 40
		}
		bar := strings.Repeat("█", barLen)
		fmt.Printf("%s %-45s TTFB: %7s | Total: %7s\n", medal, r.Label, fmtDur(r.TTFB), fmtDur(r.Total))
		fmt.Printf("   %s\n", bar)
	}
	fmt.Println(strings.Repeat("-", 60))
	if len(results) > 0 {
		fmt.Printf("  🏆 EN HIZLI: %s (%s)\n", results[0].Label, fmtDur(results[0].Total))
	}
	fmt.Println()
}

var httpClient = &http.Client{
	Transport: &http.Transport{
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     30 * time.Second,
	},
	Timeout: 60 * time.Second,
}

func benchLLM(model string, systemPrompt string, maxTokens int) Result {
	type Msg struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	payload := map[string]any{
		"model": model,
		"messages": []Msg{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: "Hash map ve array arasındaki farkı açıklayabilir misin?"},
		},
		"stream":      true,
		"max_tokens":  maxTokens,
		"temperature": 0.7,
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://openrouter.ai/api/v1/chat/completions", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer "+OPENROUTER_API_KEY)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", SITE_URL)
	req.Header.Set("X-Title", "Wingman Go Benchmark")

	start := time.Now()
	resp, err := httpClient.Do(req)
	if err != nil {
		return Result{Label: model, TTFB: -1, Total: -1, Extra: map[string]any{"error": err.Error()}}
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		errBody, _ := io.ReadAll(resp.Body)
		errStr := string(errBody)
		if len(errStr) > 100 {
			errStr = errStr[:100]
		}
		return Result{Label: model, TTFB: -1, Total: -1, Extra: map[string]any{"error": fmt.Sprintf("%d: %s", resp.StatusCode, errStr)}}
	}

	var ttfb time.Duration
	tokens := 0
	fullText := ""

	scanner := bufio.NewScanner(resp.Body)
	buf := make([]byte, 64*1024)
	scanner.Buffer(buf, 64*1024)

	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		data := strings.TrimSpace(line[6:])
		if data == "[DONE]" {
			continue
		}
		var parsed struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(data), &parsed); err != nil {
			continue
		}
		if len(parsed.Choices) > 0 && parsed.Choices[0].Delta.Content != "" {
			token := parsed.Choices[0].Delta.Content
			tokens++
			fullText += token
			if ttfb == 0 {
				ttfb = time.Since(start)
			}
		}
	}

	total := time.Since(start)
	tokPerSec := 0.0
	if total.Seconds() > 0 {
		tokPerSec = float64(tokens) / total.Seconds()
	}

	return Result{
		Label: model,
		TTFB:  ttfb,
		Total: total,
		Extra: map[string]any{"tokens": tokens, "tok/s": int(tokPerSec), "respLen": len(fullText)},
	}
}

func benchTTSFetch(text string, format string, speed float64) Result {
	payload, _ := json.Marshal(map[string]any{
		"input":           text,
		"response_format": format,
		"speed":           speed,
	})
	url := fmt.Sprintf("https://fal.run/%s/audio/speech", TTS_ENDPOINT)
	req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
	req.Header.Set("Authorization", "Key "+FAL_KEY)
	req.Header.Set("Content-Type", "application/json")

	start := time.Now()
	resp, err := httpClient.Do(req)
	if err != nil {
		return Result{Label: fmt.Sprintf("TTS fetch(%s)", format), TTFB: -1, Total: -1}
	}
	defer resp.Body.Close()
	ttfb := time.Since(start)

	if resp.StatusCode != 200 {
		return Result{Label: fmt.Sprintf("TTS fetch(%s)", format), TTFB: -1, Total: -1}
	}
	bodyBytes, _ := io.ReadAll(resp.Body)
	total := time.Since(start)

	return Result{
		Label: fmt.Sprintf("GO fetch [%s] speed=%.1f", format, speed),
		TTFB:  ttfb,
		Total: total,
		Extra: map[string]any{"bytes": len(bodyBytes), "textLen": len(text)},
	}
}

func benchSTTFetch(audioData []byte) Result {
	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	part, _ := w.CreateFormFile("file", "audio.wav")
	part.Write(audioData)
	w.WriteField("language", "tr")
	w.Close()

	url := fmt.Sprintf("https://fal.run/%s/audio/transcriptions", STT_ENDPOINT)
	req, _ := http.NewRequest("POST", url, &b)
	req.Header.Set("Authorization", "Key "+FAL_KEY)
	req.Header.Set("Content-Type", w.FormDataContentType())

	start := time.Now()
	resp, err := httpClient.Do(req)
	if err != nil {
		return Result{Label: "GO STT fetch", TTFB: -1, Total: -1}
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return Result{Label: "GO STT fetch", TTFB: -1, Total: -1}
	}
	var result struct {
		Text string `json:"text"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	total := time.Since(start)

	transcript := result.Text
	if len(transcript) > 60 {
		transcript = transcript[:60]
	}

	return Result{
		Label: "GO STT fetch",
		TTFB:  total,
		Total: total,
		Extra: map[string]any{"transcript": transcript, "audioBytes": len(audioData)},
	}
}

func generateTestAudio(text string) ([]byte, error) {
	payload, _ := json.Marshal(map[string]any{
		"input": text, "response_format": "wav", "speed": 1.0,
	})
	url := fmt.Sprintf("https://fal.run/%s/audio/speech", TTS_ENDPOINT)
	req, _ := http.NewRequest("POST", url, bytes.NewReader(payload))
	req.Header.Set("Authorization", "Key "+FAL_KEY)
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("TTS failed: %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

func main() {
	loadEnv()

	fmt.Println("🚀 Go Benchmark — Runtime Karşılaştırması (Go vs Bun)")
	fmt.Println(strings.Repeat("-", 60))
	fmt.Println("   Go HTTP client with keep-alive + connection pooling")
	fmt.Println()

	shortPrompt := "Sen Wingman, Türkçe teknik mülakatçısın. Kısa ve öz cevap ver, 2-3 cümle."
	mediumText := "Hash map kullanarak bu problemi O(n) zamanda çözebilirsin. Her elemanı gezerken complement hesapla."

	// ═══ LLM ═══
	fmt.Println("🤖 LLM Model Karşılaştırması")
	models := []string{
		"google/gemini-2.5-flash",
		"google/gemini-2.5-flash:nitro",
		"google/gemini-2.0-flash-001",
		"google/gemini-2.0-flash-lite-001",
		"openai/gpt-4o-mini",
		"anthropic/claude-3-haiku",
		"meta-llama/llama-3.1-8b-instruct:nitro",
		"mistralai/mistral-small-3.1-24b-instruct",
	}

	var llmResults []Result
	for _, model := range models {
		fmt.Printf("   %s ... ", model)
		r := benchLLM(model, shortPrompt, 200)
		if r.TTFB >= 0 {
			fmt.Printf("TTFB: %s, Total: %s, %v tok/s\n", fmtDur(r.TTFB), fmtDur(r.Total), r.Extra["tok/s"])
			llmResults = append(llmResults, r)
		} else {
			fmt.Printf("❌ %v\n", r.Extra["error"])
		}
		time.Sleep(500 * time.Millisecond)
	}
	printResults("GO — LLM TTFT Karşılaştırması", llmResults)

	// ═══ TTS ═══
	fmt.Println("🔊 TTS Karşılaştırması")
	var ttsResults []Result
	for _, format := range []string{"pcm", "wav", "mp3"} {
		fmt.Printf("   fetch %s ... ", format)
		r := benchTTSFetch(mediumText, format, 1.0)
		if r.TTFB >= 0 {
			fmt.Printf("TTFB: %s, Total: %s\n", fmtDur(r.TTFB), fmtDur(r.Total))
			ttsResults = append(ttsResults, r)
		} else {
			fmt.Println("❌")
		}
		time.Sleep(300 * time.Millisecond)
	}
	// Short sentence (pipeline first sentence)
	fmt.Print("   fetch pcm (kısa cümle) ... ")
	rShort := benchTTSFetch("Evet, bu iyi bir yaklaşım.", "pcm", 1.0)
	rShort.Label = "GO fetch [pcm] kısa cümle"
	if rShort.TTFB >= 0 {
		fmt.Printf("TTFB: %s, Total: %s\n", fmtDur(rShort.TTFB), fmtDur(rShort.Total))
		ttsResults = append(ttsResults, rShort)
	}
	printResults("GO — TTS Karşılaştırması", ttsResults)

	// ═══ STT ═══
	fmt.Println("🎤 STT Karşılaştırması")
	fmt.Print("   Test audio oluşturuluyor... ")
	audioData, err := generateTestAudio("Ben bu problemi şöyle çözmeyi düşünüyorum.")
	if err != nil {
		fmt.Printf("❌ %v\n", err)
		return
	}
	fmt.Printf("%d bytes\n", len(audioData))

	var sttResults []Result
	for i := 0; i < 3; i++ {
		fmt.Printf("   Run %d ... ", i+1)
		r := benchSTTFetch(audioData)
		if r.TTFB >= 0 {
			fmt.Printf("Total: %s — \"%v\"\n", fmtDur(r.Total), r.Extra["transcript"])
			sttResults = append(sttResults, r)
		} else {
			fmt.Println("❌")
		}
		time.Sleep(300 * time.Millisecond)
	}
	printResults("GO — STT Latency", sttResults)

	// ═══ ÖZET ═══
	fmt.Println(strings.Repeat("=", 60))
	fmt.Println("  ⚡ E2E TAHMİN (En iyi sonuçlarla)")
	fmt.Println(strings.Repeat("=", 60))

	if len(llmResults) > 0 && len(sttResults) > 0 && len(ttsResults) > 0 {
		sort.Slice(llmResults, func(i, j int) bool { return llmResults[i].TTFB < llmResults[j].TTFB })
		sort.Slice(sttResults, func(i, j int) bool { return sttResults[i].Total < sttResults[j].Total })
		sort.Slice(ttsResults, func(i, j int) bool { return ttsResults[i].TTFB < ttsResults[j].TTFB })

		stt := sttResults[0].Total
		llmTTFT := llmResults[0].TTFB
		ttsTTFB := ttsResults[0].TTFB
		e2e := stt + llmTTFT + ttsTTFB

		fmt.Printf("  STT:       %s  (%s)\n", fmtDur(stt), sttResults[0].Label)
		fmt.Printf("  LLM TTFT:  %s  (%s)\n", fmtDur(llmTTFT), llmResults[0].Label)
		fmt.Printf("  TTS TTFB:  %s  (%s)\n", fmtDur(ttsTTFB), ttsResults[0].Label)
		fmt.Println(strings.Repeat("-", 60))
		fmt.Printf("  TOPLAM:    %s\n", fmtDur(e2e))
		if e2e < 2*time.Second {
			fmt.Println("  ✅ 2 SANİYENİN ALTINDA!")
		} else {
			over := e2e - 2*time.Second
			fmt.Printf("  ❌ 2s hedefine %s uzak\n", fmtDur(over))
		}
	}
	fmt.Println(strings.Repeat("=", 60))
}
