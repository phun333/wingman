# @ffh/video

Wingman hackathon demo videosu — [Remotion](https://remotion.dev) ile oluşturulmuş programatik video.

## Görevleri

- Wingman platformunun tanıtım videosunun oluşturulması
- Hackathon sunumu için profesyonel video üretimi

## Yapı

```
apps/video/
├── public/           # Statik dosyalar (logo vb.)
├── src/
│   ├── components/   # Yeniden kullanılabilir animasyon bileşenleri
│   │   ├── AnimatedCounter.tsx
│   │   ├── Background.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── GlowBadge.tsx
│   │   └── TypewriterText.tsx
│   ├── scenes/       # Video sahneleri
│   │   ├── IntroScene.tsx      # Logo reveal + başlık
│   │   ├── ProblemScene.tsx    # Problem tanımı
│   │   ├── SolutionScene.tsx   # Wingman tanıtımı
│   │   ├── FeaturesScene.tsx   # Özellikler
│   │   ├── PipelineScene.tsx   # Sesli mülakat boru hattı
│   │   ├── TechStackScene.tsx  # Teknoloji yığını + istatistikler
│   │   └── OutroScene.tsx      # Kapanış + CTA
│   ├── fonts.ts      # Google Fonts yükleme
│   ├── theme.ts      # Design tokens (renkler, fontlar)
│   ├── WingmanDemo.tsx # Ana composition
│   ├── Root.tsx      # Remotion root
│   └── index.ts      # Entry point
├── remotion.config.ts
├── package.json
└── tsconfig.json
```

## Komutlar

```bash
# Remotion Studio'yu aç (önizleme)
bun run --filter @ffh/video studio

# MP4 olarak render et
bun run --filter @ffh/video render

# GIF olarak render et
bun run --filter @ffh/video render:gif
```

## Video Özellikleri

- **Çözünürlük:** 1920×1080 (Full HD)
- **FPS:** 30
- **Süre:** ~30 saniye (900 frame)
- **Sahneler:** 7 sahne, fade geçişleri ile

## Tasarım

Video, Wingman web uygulamasının tasarım sistemini kullanır:

- **Fontlar:** Bricolage Grotesque, DM Sans, JetBrains Mono
- **Renk şeması:** Koyu arka plan (#07070a) + kehribar vurgular (#e5a10e)
- **Animasyonlar:** Spring-based giriş animasyonları, interpolation
