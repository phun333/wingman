# packages/tsconfig

Paylaşılan TypeScript yapılandırma dosyalarını içerir. `@ffh/tsconfig` paket adıyla diğer çalışma alanları tarafından referans alınır.

## Görevleri

- Monorepo genelinde tutarlı TypeScript derleyici ayarları sağlama
- Farklı ortamlar (API, web, temel) için özelleştirilmiş yapılandırmalar sunma

## Yapılandırma Dosyaları

| Dosya | Açıklama | Kullanan |
|-------|----------|----------|
| `base.json` | Temel yapılandırma (strict mod, ESNext, bundler çözümlemesi) | Tüm paketler |
| `api.json` | Sunucu tarafı yapılandırması (Bun ve Node tipleri dahil) | `apps/api` |
| `web.json` | İstemci tarafı yapılandırması (DOM, JSX desteği) | `apps/web` |

## Kullanım

Diğer paketlerin `tsconfig.json` dosyasında şu şekilde genişletilir:

```json
{
  "extends": "@ffh/tsconfig/api.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

## Temel Yapılandırma Ayarları

- `strict: true` ile katı tip denetimi
- `moduleResolution: "bundler"` ile modern modül çözümlemesi
- `noUncheckedIndexedAccess: true` ile güvenli dizin erişimi
- `isolatedModules: true` ile bağımsız modül derlemesi
- `noEmit: true` ile sadece tip denetimi (çıktı üretmez)
