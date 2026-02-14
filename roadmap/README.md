# roadmap

Wingman platformunun fazlara ayrılmış geliştirme yol haritasını içerir. Her faz bağımsız okunabilir bir belge olarak hazırlanmıştır. Görevler, bağımlılıklar ve tamamlanma durumları her dosyada ayrıntılı şekilde belirtilir.

## Görevleri

- Geliştirme sürecini mantıksal fazlara ayırma
- Her faz için görevleri, bağımlılıkları ve dosya yollarını belgeleme
- İlerleme durumunu takip etme

## Faz Dosyaları

| Faz | Dosya | Başlık | Durum |
|-----|-------|--------|-------|
| 0 | FAZ-00.md | Temel Altyapı ve Doğrulama | Tamamlandı |
| 1 | FAZ-01.md | Sesli Yapay Zeka Ajanı (Ses Boru Hattı) | Tamamlandı |
| 2 | FAZ-02.md | Mülakat Oturum Yönetimi | Tamamlandı |
| 3 | FAZ-03.md | Canlı Kodlama Modülü | Tamamlandı |
| 4 | FAZ-04.md | Sistem Tasarımı (Beyaz Tahta) | Tamamlandı |
| 5 | FAZ-05.md | Telefon Mülakatı ve Pratik Modu | Tamamlandı |
| 6 | FAZ-06.md | Kişiselleştirme ve Hazırlık | Tamamlandı |
| 7 | FAZ-07.md | Raporlama ve Geri Bildirim | Tamamlandı |
| 8 | FAZ-08.md | Kurumsal Panel | Yapılmadı |
| 9 | FAZ-09.md | Ön Yüz Arayüzü ve Tasarım Sistemi | Tamamlandı |
| 10 | FAZ-10.md | Üretim ve Optimizasyon | Yapılmadı |

## Bağımlılık Yapısı

```
Faz 0 --- Temel Altyapı
  |
  +---> Faz 1 --- Ses Boru Hattı
  |       |
  |       +---> Faz 2 --- Oturum Yönetimi
  |       |       |
  |       |       +---> Faz 3 --- Canlı Kodlama
  |       |       +---> Faz 4 --- Sistem Tasarımı
  |       |       +---> Faz 5 --- Telefon Mülakatı ve Pratik
  |       |       +---> Faz 6 --- Kişiselleştirme
  |       |               |
  |       |               +---> Faz 7 --- Raporlama
  |       |                       |
  |       |                       +---> Faz 8 --- Kurumsal Panel
  |       |
  |       +---> Faz 9 --- Ön Yüz Arayüzü
  |
  +---> Faz 10 -- Üretim ve Optimizasyon
```

## Hackathon Asgari Uygulanabilir Ürün Sırası

Minimum demo için önerilen ilerleme sırası:

1. Faz 0 — Altyapıyı kur
2. Faz 1 — Sesli yapay zeka ajanını çalıştır
3. Faz 9 — Temel arayüzü oluştur
4. Faz 2 — Oturum yönetimini ekle
5. Faz 3 — Canlı kodlama modülünü entegre et
6. Faz 7 — Basit raporlama ekle
