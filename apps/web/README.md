# apps/web

Wingman platformunun istemci tarafı uygulamasıdır. React 19, Tailwind CSS 4 ve Vite ile geliştirilmiş tek sayfa uygulamasıdır (SPA).

## Görevleri

- Kullanıcı arayüzü sunma (giriş, kayıt, gösterge paneli, mülakat odası, raporlar)
- WebSocket üzerinden sesli mülakat oturumuna bağlanma
- Monaco editör ile canlı kod düzenleme
- tldraw ile sistem tasarımı beyaz tahtası
- Mikrofon erişimi, ses kaydı ve PCM16 ses çözümleme
- Convex üzerinden kimlik doğrulama (better-auth)
- Durum yönetimi (Zustand)

## Klasör Yapısı

```
src/
  App.tsx               Rota tanımları ve kimlik doğrulama koruması
  main.tsx              React giriş noktası
  index.css             Tailwind CSS ve tasarım belirteçleri
  lib/
    api.ts              API istekleri için fetch sarmalayıcısı
    audio.ts            PCM16 ses çözümleme, AudioQueuePlayer, ses ölçer
    auth.tsx            useAuth() kancası ve AuthProvider
    constants.ts        Sabit değerler
    useVoice.ts         WebSocket kancası (VAD, otomatik yeniden bağlanma, ipucu)
    utils.ts            Yardımcı fonksiyonlar
    whiteboard-export.ts      tldraw durumunu PNG/SVG olarak dışa aktarma
    whiteboard-serializer.ts  tldraw durumunu LLM için metne dönüştürme
  pages/
    LandingPage.tsx     Karşılama sayfası (giriş yapmamış kullanıcılar için)
    LoginPage.tsx       E-posta ve parola ile giriş
    RegisterPage.tsx    Yeni hesap oluşturma
    DashboardPage.tsx   Gösterge paneli (hoş geldin, hızlı başlat, son mülakatlar)
    NewInterviewPage.tsx    Yeni mülakat sihirbazı (tür, zorluk, ayarlar)
    InterviewRoomPage.tsx   Mülakat odası (sesli, kodlama, sistem tasarımı)
    QuestionsPage.tsx   Soru bankası
    HistoryPage.tsx     Geçmiş mülakatlar
    ReportPage.tsx      Mülakat raporu (skor, radar grafiği, analiz)
    ProgressPage.tsx    İlerleme takibi (grafikler, istatistikler)
    JobsPage.tsx        İş ilanları ve çalışma yol haritaları
    SettingsPage.tsx    Profil, özgeçmiş, iş ilanları, hafıza ayarları
  stores/
    index.ts                 Zustand mağaza giriş noktası
    use-interviews-store.ts  Mülakat durumu
    use-jobs-store.ts        İş ilanı durumu
    use-profile-store.ts     Kullanıcı profili durumu
    use-questions-store.ts   Soru durumu
  components/
    ui/                 Temel arayüz bileşenleri (Button, Card, Badge, Input, Toast, vb.)
    layout/             Sayfa düzeni (AppLayout, Sidebar, Topbar, FloatingOrbs)
    icons/              Özel simgeler (WingLogo, LanguageIcons)
    interview/
      VoiceBar.tsx              Mikrofon kontrolü ve durum göstergesi
      VoiceAssistant.tsx        Sesli asistan bileşeni
      AIAssistant.tsx           Yapay zeka asistan paneli
      AIChat.tsx                Yapay zeka sohbet bileşeni
      ChatThread.tsx            Sohbet mesaj dizisi
      CodeEditor.tsx            Monaco editör sarmalayıcısı
      ProblemPanel.tsx          Kodlama sorusu açıklaması
      TestResultsPanel.tsx      Test sonuçları
      ResizableSplitter.tsx     Panel boyutlandırma ayırıcısı
      SolutionComparisonPanel.tsx  Optimal çözüm karşılaştırması
      SystemDesignRoom.tsx      Sistem tasarımı ana düzeni
      whiteboard/
        WhiteboardCanvas.tsx    tldraw sarmalayıcısı ve senkronizasyon
        ComponentPalette.tsx    Sürükle-bırak bileşen paleti
        DesignProblemPanel.tsx  Tasarım sorusu ve gereksinimler paneli
        design-shapes.tsx       10 özel tldraw şekli (Veritabanı, Önbellek, vb.)
```

## Mülakat Türleri

- **Canlı Kodlama**: Sol panelde soru, sağda Monaco editör, altta test sonuçları
- **Sistem Tasarımı**: Sol panelde gereksinimler, sağda tldraw beyaz tahtası
- **Telefon Mülakatı**: Sadece sesli arayüz, orb animasyonu, soru sayacı
- **Pratik**: Kod editörü + ipucu sistemi + çözüm karşılaştırması

## Çalıştırma

```bash
bun run dev        # Vite geliştirme sunucusu
bun run build      # Üretim derlemesi
bun run preview    # Üretim önizlemesi
```

Varsayılan olarak `http://localhost:3000` adresinde çalışır.
