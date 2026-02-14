import { Hono } from "hono";

interface DocPage {
  id: string;
  title: string;
  description: string;
  url: string;
  content: string;
}

const pages: DocPage[] = [
  {
    id: "index",
    title: "Wingman Nedir?",
    description: "AI destekli mülakat hazırlık platformu",
    url: "/",
    content:
      "Wingman yazılım mühendisliği mülakatlarına hazırlanmanı kolaylaştıran AI destekli mülakat simülasyon platformu sesli gerçek zamanlı mülakat kod editörü whiteboard",
  },
  {
    id: "getting-started",
    title: "Başlangıç Rehberi",
    description: "Wingman'i kullanmaya başlamak için adım adım rehber",
    url: "/getting-started",
    content:
      "hızlı başlangıç hesap oluştur dashboard mülakat türü seç zorluk seviyesi programlama dili mikrofon izni rapor",
  },
  {
    id: "hesap-olusturma",
    title: "Hesap Oluşturma",
    description: "Kayıt olma ve hesap yönetimi",
    url: "/hesap-olusturma",
    content:
      "kayıt olma e-posta şifre giriş yapma hesap ayarları profil bilgileri şifre değiştirme dil tercihi bildirimler güvenlik better-auth",
  },
  {
    id: "mulakat-turleri",
    title: "Mülakat Türleri",
    description: "Dört farklı mülakat türü ve özellikleri",
    url: "/mulakat-turleri",
    content:
      "live coding system design phone screen practice algoritma veri yapısı whiteboard davranışsal sorular STAR metodu pratik modu",
  },
  {
    id: "sesli-mulakat",
    title: "Sesli Mülakat",
    description: "Türkçe sesli AI mülakat deneyimi",
    url: "/sesli-mulakat",
    content:
      "sesli AI mülakatçı Freya STT TTS speech-to-text text-to-speech fal.ai pipeline mikrofon dinleme konuşma Türkçe ses modeli",
  },
  {
    id: "kod-editoru",
    title: "Kod Editörü",
    description: "Monaco tabanlı gerçek zamanlı kod editörü",
    url: "/kod-editoru",
    content:
      "Monaco VS Code syntax highlighting otomatik tamamlama IntelliSense JavaScript TypeScript Python kod çalıştırma klavye kısayolları",
  },
  {
    id: "sistem-tasarim",
    title: "Sistem Tasarımı",
    description: "Whiteboard destekli sistem tasarımı mülakatları",
    url: "/sistem-tasarim",
    content:
      "whiteboard tldraw diyagram şekiller oklar sistem tasarımı gereksinim analizi üst düzey tasarım detaylı tasarım trade-off SQL NoSQL microservice",
  },
  {
    id: "soru-bankasi",
    title: "Soru Bankası",
    description: "LeetCode entegrasyonu ve soru havuzu",
    url: "/soru-bankasi",
    content:
      "LeetCode soru arama rastgele soru easy medium hard array string linked list tree graph dynamic programming sorting hash table two pointers sliding window",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Ana kontrol paneli özellikleri",
    url: "/dashboard",
    content:
      "dashboard istatistik toplam mülakat tamamlanan streak hızlı başlatma son mülakatlar activity heatmap komut paleti",
  },
  {
    id: "gecmis-ve-raporlar",
    title: "Geçmiş ve Raporlar",
    description: "Mülakat geçmişi ve detaylı raporlar",
    url: "/gecmis-ve-raporlar",
    content:
      "mülakat geçmişi filtre detaylı rapor performans puanı teknik değerlendirme iletişim kod kalitesi Big-O analizi",
  },
  {
    id: "ilerleme-takibi",
    title: "İlerleme Takibi",
    description: "Performans istatistikleri ve gelişim takibi",
    url: "/ilerleme-takibi",
    content:
      "ilerleme istatistik başarı oranı ortalama süre en uzun streak haftalık aktivite konu bazlı performans zorluk dağılımı heatmap",
  },
  {
    id: "is-ilanlari",
    title: "İş İlanları",
    description: "Kişiselleştirilmiş mülakat hazırlığı",
    url: "/is-ilanlari",
    content:
      "iş ilanları şirket pozisyon teknoloji gereksinim analiz özelleştirilmiş sorular hedefli pratik kişiselleştirme",
  },
  {
    id: "klavye-kisayollari",
    title: "Klavye Kısayolları",
    description: "Tüm klavye kısayolları listesi",
    url: "/klavye-kisayollari",
    content:
      "klavye kısayolları Ctrl+K komut paleti Ctrl+Enter kod çalıştır Ctrl+F bul Ctrl+Z geri al navigasyon",
  },
  {
    id: "sss",
    title: "Sıkça Sorulan Sorular",
    description: "En çok sorulan sorular ve cevapları",
    url: "/sss",
    content:
      "ücretsiz tarayıcı mikrofon ses gecikmesi kod kaydediliyor süre limiti yarıda bırakma tekrar çözme veri güvenliği hesap silme destek geri bildirim",
  },
];

/**
 * Search pages and return results in Fumadocs SortedResult format:
 * { id, url, type, content }[]
 */
function searchPages(query: string) {
  if (!query || query.trim().length === 0) return [];

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  if (terms.length === 0) return [];

  return pages
    .map((page) => {
      const haystack =
        `${page.title} ${page.description} ${page.content}`.toLowerCase();
      let score = 0;

      for (const term of terms) {
        if (page.title.toLowerCase().includes(term)) score += 10;
        if (page.description.toLowerCase().includes(term)) score += 5;
        if (haystack.includes(term)) score += 1;
      }

      return { page, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ page }) => ({
      id: page.id,
      url: page.url,
      type: "page" as const,
      content: page.title,
    }));
}

export const docsSearchRoutes = new Hono();

docsSearchRoutes.get("/", (c) => {
  const query = c.req.query("query") ?? "";
  const results = searchPages(query);
  return c.json(results);
});
