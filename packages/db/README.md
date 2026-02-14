# packages/db

Convex veritabanı istemci sarmalayıcısıdır. `@ffh/db` paket adıyla diğer çalışma alanları tarafından kullanılır.

## Görevleri

- Convex HTTP istemcisini yapılandırarak dışa aktarma
- Ortam değişkenlerinden Convex URL'sini alarak bağlantı oluşturma

## Kullanım

```typescript
import { convex } from "@ffh/db";
import { api } from "../convex/_generated/api";

// Sorgu çalıştırma
const users = await convex.query(api.users.list);

// Mutasyon çalıştırma
await convex.mutation(api.users.create, { email: "ornek@mail.com", name: "Ali" });
```

## Dosya Yapısı

```
src/
  client.ts    ConvexHttpClient örneği oluşturma ve yapılandırma
  index.ts     Modül dışa aktarma noktası
```
