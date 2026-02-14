# dataset

LeetCode soru veri setini ve Convex veritabanına aktarmak için kullanılan dönüştürme aracını içerir.

## Görevleri

- LeetCode sorularını CSV formatından Convex'in kabul ettiği JSONL formatına dönüştürme
- Soru verilerini temizleme, doğrulama ve zenginleştirme (FAANG kontrolü, alan hesaplama)

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `leetcode.csv` | Ham LeetCode soru veri seti (CSV formatında) |
| `leetcode-problems.jsonl` | Dönüştürülmüş soru veri seti (Convex'e aktarılmaya hazır JSONL) |
| `convert-leetcode-csv.ts` | CSV'den JSONL'ye dönüştürme betiği |

## Kullanım

```bash
# CSV'yi JSONL'ye dönüştür
bun run dataset/convert-leetcode-csv.ts

# Convex veritabanına aktar
bunx convex import --table leetcodeProblems dataset/leetcode-problems.jsonl
```

## Veri Yapısı

Her soru kaydı şu alanları içerir:

- LeetCode kimlik numarası ve başlığı
- Açıklama ve zorluk seviyesi
- Kabul oranı ve sıklık puanı
- İlgili konular (dizi, dinamik programlama, vb.)
- Soran şirketler listesi
- FAANG tarafından sorulma durumu
- Beğeni/beğenmeme sayıları ve puan

## Öneri Sistemi Entegrasyonu

Bu veri seti, CV bazlı akıllı öneri sistemi (`apps/api/src/services/recommendation.ts`) tarafından kullanılır. Sistem, kullanıcının CV'sini LLM ile analiz ettikten sonra bu 1825 problemi 7 farklı kriterle puanlar:

- **relatedTopics** → CV'deki zayıf alanlarla eşleştirme
- **companies** → Hedef şirket eşleştirme
- **difficulty** → Deneyim seviyesine uygun zorluk filtresi
- **frequency** → Sık sorulan sorulara öncelik
- **askedByFaang** → FAANG bonusu
