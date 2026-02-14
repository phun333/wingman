# presentation

Hackathon sunumu için hazırlanmış HTML tabanlı sunum dosyalarını içerir. Projenin tasarım dilini (renk paleti, yazı tipleri, bileşenler) yansıtan özel tasarımlı slaytlardır.

## Görevleri

- Wingman platformunun hackathon jürisine tanıtılması
- Kullanıcı senaryolarının görselleştirilmesi
- Projenin teknik mimarisinin ve özelliklerinin sunulması

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `presentation.html` | Ana sunum (proje tanıtımı, mimari, özellikler, demo akışı) |
| `user-scenarios.html` | Kullanıcı senaryoları (tipik kullanım akışları ve deneyim gösterimi) |

## Öne Çıkan Özellik: CV Bazlı Akıllı Öneri Sistemi

Sunum sırasında demo edilebilecek güçlü bir farklılaştırıcı özellik:

**Senaryo:** Kullanıcı CV'sini yükler → Sistem LLM ile CV'yi analiz eder → 1825 LeetCode problemini 7 farklı kriterle puanlar → Kişiselleştirilmiş çalışma planı önerir.

**Neden etkileyici:**
- İki aşamalı hibrit mimari (LLM + deterministic scoring) — saf LLM'den daha hızlı ve tutarlı
- LLM sadece 1 kez çağrılır (CV analizi), sonraki tüm öneri çağrıları milisaniyeler içinde
- 7 farklı scoring kriteri: zayıf alan eşleşmesi, topic proficiency, zorluk uyumu, şirket eşleşmesi, sıklık, FAANG bonusu, güçlü alan cezası
- ML/regression gerektirmez — labeled training data olmadan çalışır

## Tasarım

Sunum dosyaları projenin kendi tasarım belirteçlerini kullanır:

- Yazı tipleri: Bricolage Grotesque, DM Sans, JetBrains Mono
- Renk şeması: Koyu arka plan (#07070a) ve kehribar vurgular (#e5a10e)
- Simgeler: Remix Icon kütüphanesi

Dosyalar bağımsız HTML dosyalarıdır ve herhangi bir tarayıcıda doğrudan açılabilir.
