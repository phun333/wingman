# dataset

Convex veritabanını seed etmek için kullanılan veri dosyaları.

## Dosyalar

| Dosya | Kayıt | Açıklama |
|-------|-------|----------|
| `leetcode.csv` | ~1825 | Ham LeetCode soru veri seti |
| `leetcode-problems.jsonl` | 1825 | Convex'e aktarılmaya hazır LeetCode soruları |
| `jobs.jsonl` | ~1826 | hiring.cafe'den scrape edilen iş ilanları |
| `convert-leetcode-csv.ts` | — | CSV → JSONL dönüştürme betiği |

## Yeni Ortam Kurulumu (Seed)

Yeni bir Convex deployment'ında veritabanını doldurmak için:

```bash
# 1. LeetCode sorularını yükle
bunx convex import --table leetcodeProblems dataset/leetcode-problems.jsonl

# 2. İş ilanlarını yükle (Go scraper ile)
cd apps/scraper && go build -o scraper .
./scraper -seed -input ../../dataset/jobs.jsonl

# 3. Coding problemlerini yükle (Convex internal mutation)
bunx convex run seed:seedProblems
```

## Verileri Güncelleme

### Job'ları Güncelleme (hiring.cafe'den taze çekim)

```bash
cd apps/scraper && go build -o scraper .

# 1. Tüm job'ları scrape et → Convex'e yaz
./scraper -sync

# 2. Convex'ten export et → dataset/jobs.jsonl (repo'ya commit için)
./scraper -export
```

### Tam Döngü

```
hiring.cafe ──scraper -sync──▸ Convex DB ──scraper -export──▸ dataset/jobs.jsonl
                                                                    │
                                                               git commit
                                                                    │
                                            Yeni Convex ◂──scraper -seed──
```

## Scraper Komutları

```bash
cd apps/scraper

# Tüm job'ları scrape et → Convex
./scraper -sync

# Belirli query'ler ile scrape
./scraper -sync -queries "React,Go Developer"

# Convex → JSONL export
./scraper -export                          # → dataset/jobs.jsonl
./scraper -export -output /tmp/backup.jsonl

# JSONL → Convex seed
./scraper -seed                            # ← dataset/jobs.jsonl
./scraper -seed -input /tmp/backup.jsonl

# Tek query test
./scraper -query "Software Engineer"

# HTTP API server
./scraper -serve
```

## Veri Yapıları

### jobs.jsonl

Her satır bir iş ilanı:

```json
{
  "externalId": "lever___picus___abc123",
  "title": "Software Engineer",
  "company": "Picus Security",
  "applyUrl": "https://jobs.lever.co/picus/...",
  "source": "lever",
  "location": "Turkey",
  "workplaceType": "Remote",
  "countries": ["TR"],
  "seniorityLevel": "Mid Level",
  "commitment": ["Full Time"],
  "category": "Software Development",
  "skills": ["Go", "Python", "AWS"],
  "companyIndustry": "Information Technology",
  "isExpired": false,
  "scrapedAt": 1771083488000
}
```

### leetcode-problems.jsonl

Her satır bir LeetCode sorusu (bkz. `convex/schema.ts` → `leetcodeProblems`).
