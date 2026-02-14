# infra

Wingman platformunun Docker ile paketlenmesi ve dağıtım yapılandırmasını içerir. Tek bir konteyner içinde API sunucusu, WebSocket, statik dosya sunumu ve kimlik doğrulama vekili çalışır.

## Görevleri

- Çok aşamalı Docker derlemesi ile üretim görüntüsü oluşturma
- Docker Compose ile tek komutla dağıtım
- Sağlık kontrolü yapılandırması
- Ortam değişkeni yönetimi

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `Dockerfile` | Çok aşamalı derleme (Vite ön yüz derlemesi + Bun API sunucusu) |
| `docker-compose.yml` | Tek servis yapılandırması (Dokploy/Traefik uyumlu) |
| `.env.example` | Gerekli ortam değişkenleri şablonu |

## Derleme Aşamaları

Dockerfile iki aşamadan oluşur:

1. **Derleme aşaması** (`builder`): Bağımlılıkları yükler, Vite ile ön yüzü derler ve statik dosyaları hazırlar
2. **Üretim aşaması**: Sadece gerekli dosyaları (`apps/api`, `packages`, `convex`, `public`, `node_modules`) kopyalayarak küçük boyutlu bir görüntü oluşturur

## Mimari

Tek konteyner mimarisi şu bileşenleri barındırır:

- **REST API**: Hono üzerinde HTTP uç noktaları
- **WebSocket**: Sesli mülakat oturumları (`/ws/voice`)
- **Statik Dosya Sunumu**: Vite çıktısı (`/public` dizini)
- **Kimlik Doğrulama Vekili**: Convex HTTP'ye yönlendirme (`/api/auth/*`)

## Çalıştırma

```bash
# Görüntüyü derle ve başlat
docker compose -f infra/docker-compose.yml up --build

# Arka planda çalıştır
docker compose -f infra/docker-compose.yml up -d --build
```

Konteyner `3001` portunu açar. SSL ve alan adı yönlendirmesi Traefik (Dokploy) tarafından yönetilir.
