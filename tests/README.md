# tests

Wingman platformunun API ve entegrasyon testlerini içerir. Bun'ın yerleşik test çalıştırıcısı ile çalışır.

## Görevleri

- API uç noktalarının işlevselliğini doğrulama
- Kimlik doğrulama akışını test etme
- Convex veritabanı işlemlerini doğrulama
- Sistem istemlerini kontrol etme
- Kod sanal alanının güvenliğini ve doğruluğunu test etme

## Test Dosyaları

| Dosya | Açıklama |
|-------|----------|
| `api.test.ts` | Temel API sağlık kontrolü ve uç nokta testleri |
| `api-routes.test.ts` | API rotalarının detaylı işlevsellik testleri |
| `auth.test.ts` | Kimlik doğrulama akışı testleri (giriş, kayıt, oturum) |
| `convex.test.ts` | Convex veritabanı sorgu ve mutasyon testleri |
| `prompts.test.ts` | Sistem istemi oluşturma ve doğrulama testleri |
| `sandbox.test.ts` | Kod çalıştırma sanal alanı testleri (JavaScript, Python) |

## Çalıştırma

```bash
# Tüm testleri çalıştır
bun test

# Belirli bir test dosyasını çalıştır
bun test tests/api.test.ts

# Belirli bir desene uyan testleri çalıştır
bun test --grep "auth"
```
