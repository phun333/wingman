# convex

Wingman platformunun arka uç veritabanı katmanıdır. Convex gerçek zamanlı veritabanı üzerine kurulu şema tanımları, sorgular ve mutasyonları içerir. Kimlik doğrulama için better-auth entegrasyonu kullanır.

## Görevleri

- Veritabanı şema tanımları ve dizin (index) yapılandırması
- CRUD sorguları ve mutasyonları
- Kimlik doğrulama (better-auth + Convex eklentisi)
- HTTP rotaları (kimlik doğrulama uç noktaları)
- Başlangıç verisi (kodlama soruları, tasarım soruları)

## Veritabanı Tabloları

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcı hesapları (e-posta, ad, kimlik doğrulama bağlantısı) |
| `interviews` | Mülakat oturumları (tür, zorluk, durum, yapılandırma) |
| `messages` | Mülakat sohbet mesajları (rol, içerik, zaman damgası) |
| `problems` | Kodlama soruları (başlangıç kodu, test senaryoları, optimal çözüm) |
| `designProblems` | Sistem tasarımı soruları (gereksinimler, beklenen bileşenler) |
| `leetcodeProblems` | LeetCode soru bankası (2000+ soru, şirket bilgisi, kabul oranı) |
| `interviewResults` | Mülakat sonuç raporları (puanlar, güçlü/zayıf yönler, kod analizi) |
| `jobPostings` | Kullanıcının eklediği iş ilanları (ayrıştırılmış gereksinimler, beceriler) |
| `resumes` | Kullanıcı özgeçmişleri (deneyim, eğitim, beceriler, projeler) |
| `userProfiles` | Kullanıcı profilleri (ilgi alanları, hedefler, tercih edilen dil) |
| `userMemory` | Kullanıcı hafızası (zayıf/güçlü konular, ortalama puan) |
| `companyStudyPaths` | Şirket bazlı çalışma yol haritaları (konu bazlı LeetCode soruları) |
| `jobInterviewPaths` | İş ilanına özel mülakat hazırlık planları |
| `resumeAnalysis` | CV'den çıkarılan LLM analiz verileri (topic proficiency, zayıf/güçlü alanlar) |

## Dosya Yapısı

```
auth.config.ts        Kimlik doğrulama yapılandırması
auth.ts               better-auth createAuth() fonksiyonu
convex.config.ts      Convex proje yapılandırması
http.ts               HTTP rotaları (kimlik doğrulama uç noktaları)
schema.ts             Tüm tablo tanımları ve dizinler
seed.ts               Başlangıç kodlama soruları
users.ts              Kullanıcı CRUD işlemleri
interviews.ts         Mülakat oluşturma, başlatma, tamamlama, kod/beyaz tahta kaydetme
messages.ts           Mesaj ekleme ve listeleme
problems.ts           Kodlama sorusu CRUD ve rastgele seçim
designProblems.ts     Sistem tasarımı sorusu CRUD ve başlangıç verisi (7 soru)
leetcodeProblems.ts   LeetCode sorusu sorgulama ve filtreleme
interviewResults.ts   Rapor oluşturma ve kullanıcı ilerleme istatistikleri
jobPostings.ts        İş ilanı CRUD
resumes.ts            Özgeçmiş CRUD
userProfiles.ts       Profil getirme ve güncelleme
userMemory.ts         Hafıza okuma ve yazma
companyStudyPaths.ts  Şirket çalışma yolu yönetimi
jobInterviewPaths.ts  İş ilanı mülakat yolu yönetimi
resumeAnalysis.ts     CV analiz verisi CRUD (öneri sistemi için)
```

## Yerel Geliştirme

```bash
bunx convex dev       # Geliştirme sunucusunu başlat (otomatik şema senkronizasyonu)
bunx convex deploy    # Üretime dağıt
```
