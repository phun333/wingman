import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "motion/react";
import {
  Code2,
  Waypoints,
  Phone,
  Dumbbell,
  Mic,
  Brain,
  BarChart3,
  Zap,
  ChevronRight,
  Play,
  ArrowRight,
  Star,
  Shield,
  Clock,
  MessageSquare,
  Volume2,
  FileCode,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

/* ────────────────────────────────────────────────── */
/*  Helpers                                          */
/* ────────────────────────────────────────────────── */

function FadeIn({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const offsets = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────────────── */
/*  Nav                                              */
/* ────────────────────────────────────────────────── */

function Nav() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#07070a]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-amber/15 border border-amber/20 flex items-center justify-center glow-amber-sm group-hover:glow-amber transition-shadow duration-300">
            <span className="font-display text-lg font-bold text-amber">W</span>
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-text">
            Wingman
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-text-secondary hover:text-text transition-colors duration-200">
            Özellikler
          </a>
          <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text transition-colors duration-200">
            Nasıl Çalışır
          </a>
          <a href="#interview-types" className="text-sm text-text-secondary hover:text-text transition-colors duration-200">
            Mülakat Türleri
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-medium text-text-secondary hover:text-text transition-colors duration-200 px-4 py-2"
          >
            Giriş Yap
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-amber text-[#07070a] px-5 py-2.5 text-sm font-semibold hover:bg-amber-light transition-colors duration-200 glow-amber-sm hover:glow-amber"
          >
            Ücretsiz Başla
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

/* ────────────────────────────────────────────────── */
/*  Hero                                             */
/* ────────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        {/* Radial gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[900px] h-[900px] rounded-full bg-amber/[0.04] blur-[150px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-amber/[0.02] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-info/[0.02] blur-[80px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-amber) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-amber) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Diagonal lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="40" stroke="var(--color-amber)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag)" />
        </svg>
      </motion.div>

      <motion.div style={{ opacity }} className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-amber/20 bg-amber/[0.06] px-4 py-1.5 mb-8"
        >
          <Sparkles size={13} className="text-amber" />
          <span className="text-xs font-medium text-amber tracking-wide">
            Türkçe Sesli AI Mülakatçı &middot; fal.ai &times; Freya
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight text-balance"
        >
          <span className="text-text">Teknik Mülakata</span>
          <br />
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-amber via-amber-light to-amber bg-clip-text text-transparent">
              Sesli AI
            </span>
            {/* Underline decoration */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-amber/60 to-amber-light/40 origin-left"
            />
          </span>
          <br />
          <span className="text-text">ile Hazırlan</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-8 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto text-pretty leading-relaxed"
        >
          Wingman, gerçekçi teknik mülakat simülasyonları sunar.
          <span className="text-text font-medium"> Türkçe konuşan AI mülakatçın</span> seni dinler,
          sorular sorar, kodunu değerlendirir ve detaylı rapor oluşturur.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="group inline-flex items-center gap-3 rounded-xl bg-amber text-[#07070a] px-8 py-4 text-base font-bold hover:bg-amber-light transition-all duration-300 glow-amber hover:shadow-[0_0_40px_rgba(229,161,14,0.25)]"
          >
            <Play size={18} strokeWidth={2.5} className="group-hover:scale-110 transition-transform duration-200" />
            Hemen Başla
          </Link>
          <a
            href="#how-it-works"
            className="group inline-flex items-center gap-2 rounded-xl border border-border bg-surface/50 backdrop-blur-sm px-8 py-4 text-base font-medium text-text-secondary hover:text-text hover:border-border transition-all duration-200"
          >
            Nasıl Çalışır?
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-12 flex items-center justify-center gap-6 text-text-muted"
        >
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="text-amber fill-amber" />
              ))}
            </div>
            <span className="text-xs ml-1">4.9/5</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <span className="text-xs">500+ mülakat tamamlandı</span>
          <div className="h-3 w-px bg-border" />
          <span className="text-xs">Tamamen Türkçe</span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-text-muted/30 flex items-start justify-center p-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-text-muted/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  Dashboard Preview (Mock)                         */
/* ────────────────────────────────────────────────── */

function DashboardPreview() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text text-balance">
            Gerçek Bir Mülakat Deneyimi
          </h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto text-pretty">
            AI mülakatçınız ile birebir pratik yapın. Kod yazın, sistem tasarlayın, sesli konuşun.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="relative rounded-2xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle bg-surface/80">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-danger/60" />
                <div className="w-3 h-3 rounded-full bg-amber/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 rounded-lg bg-surface-raised border border-border-subtle px-4 py-1 text-xs text-text-muted max-w-xs w-full justify-center">
                  <Shield size={10} className="text-success" />
                  wingman.ai/interview/42
                </div>
              </div>
            </div>

            {/* Mock interview room */}
            <div className="flex h-[480px]">
              {/* Left: Problem panel */}
              <div className="w-[45%] border-r border-border-subtle p-6 flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-mono text-text-muted">#42</span>
                  <span className="text-xs px-2 py-0.5 rounded-md border border-amber/30 bg-amber/10 text-amber">Orta</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-text mb-3">Two Sum</h3>
                <div className="text-sm text-text-secondary leading-relaxed space-y-3 flex-1 overflow-hidden">
                  <p>
                    Bir tam sayı dizisi <code className="text-xs px-1.5 py-0.5 rounded bg-surface-raised border border-border text-amber font-mono">nums</code> ve
                    bir tam sayı <code className="text-xs px-1.5 py-0.5 rounded bg-surface-raised border border-border text-amber font-mono">target</code> verildiğinde,
                    toplamları hedefe eşit olan iki sayının indekslerini döndürün.
                  </p>
                  <div className="rounded-lg bg-surface-raised border border-border-subtle p-3">
                    <p className="text-xs text-text-muted mb-1.5">Örnek:</p>
                    <pre className="text-xs font-mono text-text">
{`Input: nums = [2,7,11,15], target = 9
Output: [0,1]`}
                    </pre>
                  </div>
                </div>

                {/* Voice bar mock */}
                <div className="mt-4 pt-4 border-t border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-success/20 animate-pulse" style={{ margin: -3 }} />
                      <div className="relative h-9 w-9 rounded-full border-2 border-success bg-success/15 flex items-center justify-center">
                        <Mic size={14} className="text-success" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        <span className="text-[10px] text-text-muted">Dinliyor…</span>
                      </div>
                      <p className="text-xs text-text-secondary truncate">
                        <span className="text-info">Sen:</span> HashMap kullanarak O(n) çözümü düşünüyorum…
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Code editor */}
              <div className="flex-1 flex flex-col">
                {/* Editor header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-surface/40">
                  <div className="flex items-center gap-2">
                    <FileCode size={13} className="text-text-muted" />
                    <span className="text-xs text-text-muted font-mono">solution.js</span>
                  </div>
                  <span className="text-[10px] text-amber px-2 py-0.5 rounded bg-amber/10 border border-amber/20">JavaScript</span>
                </div>

                {/* Code area */}
                <div className="flex-1 p-4 font-mono text-[13px] leading-6 overflow-hidden">
                  <div className="flex gap-4">
                    <div className="text-text-muted/30 select-none text-right w-6 flex flex-col">
                      {Array.from({ length: 12 }, (_, i) => (
                        <span key={i}>{i + 1}</span>
                      ))}
                    </div>
                    <pre className="text-text/90 flex-1">
                      <code>
                        <span className="text-info/80">function</span>{" "}
                        <span className="text-amber">twoSum</span>
                        {"("}
                        <span className="text-text-secondary">nums</span>
                        {", "}
                        <span className="text-text-secondary">target</span>
                        {") {\n"}
                        {"  "}
                        <span className="text-info/80">const</span>
                        {" map = "}
                        <span className="text-info/80">new</span>
                        {" "}
                        <span className="text-amber">Map</span>
                        {"();\n\n"}
                        {"  "}
                        <span className="text-info/80">for</span>
                        {" ("}
                        <span className="text-info/80">let</span>
                        {" i = 0; i < nums.length; i++) {\n"}
                        {"    "}
                        <span className="text-info/80">const</span>
                        {" complement = target - nums[i];\n\n"}
                        {"    "}
                        <span className="text-info/80">if</span>
                        {" (map.has(complement)) {\n"}
                        {"      "}
                        <span className="text-info/80">return</span>
                        {" [map.get(complement), i];\n"}
                        {"    }\n\n"}
                        {"    map.set(nums[i], i);\n"}
                        {"  }\n"}
                        {"}"}
                      </code>
                    </pre>
                  </div>
                </div>

                {/* Test results mock */}
                <div className="border-t border-border-subtle px-4 py-3 bg-surface/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-text-muted">Test Sonuçları</span>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-success" />
                        <span className="text-xs text-success">3/3 geçti</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono">42ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
              background: "linear-gradient(135deg, rgba(229,161,14,0.03) 0%, transparent 40%, transparent 60%, rgba(59,130,246,0.02) 100%)"
            }} />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  Features                                         */
/* ────────────────────────────────────────────────── */

const features = [
  {
    icon: Volume2,
    title: "Türkçe Sesli AI",
    description: "Freya ile gerçekçi Türkçe konuşma deneyimi. Sizi dinler, anlar ve doğal bir şekilde yanıt verir.",
    accent: "amber",
  },
  {
    icon: Code2,
    title: "Gerçek Zamanlı Kod",
    description: "Monaco editör ile kod yazın, çalıştırın ve test edin. AI kodunuzu anlık olarak değerlendirir.",
    accent: "info",
  },
  {
    icon: Brain,
    title: "Akıllı Değerlendirme",
    description: "Algoritmik düşünce, kod kalitesi, iletişim becerisi — her yönden detaylı analiz.",
    accent: "success",
  },
  {
    icon: BarChart3,
    title: "Detaylı Raporlar",
    description: "Her mülakat sonrası güçlü ve zayıf yönlerinizi gösteren kapsamlı performans raporu.",
    accent: "amber",
  },
  {
    icon: MessageSquare,
    title: "Doğal Diyalog",
    description: "Gerçek bir mülakatçı gibi ipuçları verir, takip soruları sorar ve yaklaşımınızı yönlendirir.",
    accent: "info",
  },
  {
    icon: Zap,
    title: "Anında Geri Bildirim",
    description: "Kod çalıştırma, test sonuçları ve AI yorumları — beklemeden öğrenin.",
    accent: "success",
  },
];

const accentColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  amber: {
    bg: "bg-amber/10",
    border: "border-amber/20",
    text: "text-amber",
    glow: "group-hover:shadow-[0_0_30px_rgba(229,161,14,0.08)]",
  },
  info: {
    bg: "bg-info/10",
    border: "border-info/20",
    text: "text-info",
    glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.08)]",
  },
  success: {
    bg: "bg-success/10",
    border: "border-success/20",
    text: "text-success",
    glow: "group-hover:shadow-[0_0_30px_rgba(34,197,94,0.08)]",
  },
};

function Features() {
  return (
    <section id="features" className="relative py-28 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber/[0.02] blur-[150px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6">
        <FadeIn className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber mb-4">
            Özellikler
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text text-balance">
            Gerçek Mülakata En Yakın Deneyim
          </h2>
          <p className="mt-4 text-text-secondary max-w-lg mx-auto text-pretty">
            En gelişmiş AI teknolojileri ile donatılmış, kapsamlı mülakat hazırlık platformu.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const ac = accentColors[f.accent];
            return (
              <FadeIn key={f.title} delay={i * 0.08}>
                <div className={`group relative rounded-2xl border border-border-subtle bg-surface/60 backdrop-blur-sm p-6 h-full transition-all duration-300 hover:border-border ${ac.glow}`}>
                  <div className={`h-11 w-11 rounded-xl ${ac.bg} border ${ac.border} flex items-center justify-center mb-5`}>
                    <f.icon size={20} className={ac.text} strokeWidth={1.7} />
                  </div>
                  <h3 className="font-display text-base font-semibold text-text mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed text-pretty">
                    {f.description}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  How It Works                                     */
/* ────────────────────────────────────────────────── */

const steps = [
  {
    num: "01",
    title: "Mülakat Türünü Seç",
    description: "Live Coding, System Design, Phone Screen veya Practice modlarından birini seç. Zorluk seviyesini ve soru sayısını belirle.",
    icon: Play,
  },
  {
    num: "02",
    title: "AI ile Konuş",
    description: "Türkçe sesli AI mülakatçın seni karşılar, soruyu açıklar ve yaklaşımını dinler. Gerçek bir mülakat gibi diyalog kur.",
    icon: Mic,
  },
  {
    num: "03",
    title: "Kodunu Yaz ve Çalıştır",
    description: "Monaco editör ile kodunu yaz. Testleri çalıştır, sonuçları gör. AI kodunu anlık olarak takip eder.",
    icon: Code2,
  },
  {
    num: "04",
    title: "Raporunu Al",
    description: "Mülakat bitince detaylı performans raporu. Güçlü yönlerin, gelişim alanların ve puan dağılımı.",
    icon: BarChart3,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28">
      <div className="mx-auto max-w-5xl px-6">
        <FadeIn className="text-center mb-20">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber mb-4">
            Nasıl Çalışır
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text text-balance">
            4 Adımda Mülakata Hazırlan
          </h2>
        </FadeIn>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[28px] top-0 bottom-0 w-px bg-gradient-to-b from-amber/40 via-amber/20 to-transparent hidden md:block" />

          <div className="space-y-12 md:space-y-16">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.12} direction="left">
                <div className="flex gap-6 md:gap-10 items-start">
                  {/* Number orb */}
                  <div className="relative flex-shrink-0">
                    <div className="h-14 w-14 rounded-2xl bg-surface border border-border flex items-center justify-center relative z-10">
                      <span className="font-display text-lg font-bold text-amber">{step.num}</span>
                    </div>
                    {/* Glow behind */}
                    <div className="absolute inset-0 rounded-2xl bg-amber/10 blur-lg -z-10" />
                  </div>

                  {/* Content */}
                  <div className="pt-1">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon size={18} className="text-amber" strokeWidth={1.8} />
                      <h3 className="font-display text-xl font-semibold text-text">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-text-secondary leading-relaxed max-w-lg text-pretty">
                      {step.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  Interview Types                                  */
/* ────────────────────────────────────────────────── */

const interviewTypes = [
  {
    id: "live-coding",
    icon: Code2,
    title: "Live Coding",
    description: "Algoritmik problemleri gerçek zamanlı çöz. LeetCode tarzı sorularla pratik yap, kodunu yaz ve çalıştır.",
    features: ["Monaco Editör", "Test Çalıştırma", "500+ Soru"],
    gradient: "from-info/10 to-info/5",
    borderColor: "hover:border-info/30",
    accentColor: "text-info",
    accentBg: "bg-info/10",
    accentBorder: "border-info/20",
  },
  {
    id: "system-design",
    icon: Waypoints,
    title: "System Design",
    description: "Büyük ölçekli sistem tasarımı soruları. Whiteboard üzerinde tasarla, AI ile tartış.",
    features: ["Whiteboard", "Bileşen Paleti", "Mimari Analiz"],
    gradient: "from-amber/10 to-amber/5",
    borderColor: "hover:border-amber/30",
    accentColor: "text-amber",
    accentBg: "bg-amber/10",
    accentBorder: "border-amber/20",
  },
  {
    id: "phone-screen",
    icon: Phone,
    title: "Phone Screen",
    description: "Klasik telefon mülakatı simülasyonu. Sesli soru-cevap formatında, zaman yönetimi ile.",
    features: ["Sesli Diyalog", "Zaman Takibi", "Çoklu Soru"],
    gradient: "from-success/10 to-success/5",
    borderColor: "hover:border-success/30",
    accentColor: "text-success",
    accentBg: "bg-success/10",
    accentBorder: "border-success/20",
  },
  {
    id: "practice",
    icon: Dumbbell,
    title: "Practice",
    description: "Serbest pratik modu. Stres yok, zaman sınırı yok. İpucu al, öğren, tekrarla.",
    features: ["İpucu Sistemi", "Çözüm Karşılaştırma", "Süresiz"],
    gradient: "from-text-muted/10 to-text-muted/5",
    borderColor: "hover:border-text-muted/30",
    accentColor: "text-text-secondary",
    accentBg: "bg-surface-raised",
    accentBorder: "border-border",
  },
];

function InterviewTypes() {
  return (
    <section id="interview-types" className="relative py-28">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/30 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6">
        <FadeIn className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber mb-4">
            Mülakat Türleri
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-text text-balance">
            Her Senaryoya Uygun Mod
          </h2>
          <p className="mt-4 text-text-secondary max-w-lg mx-auto text-pretty">
            Hangi tür mülakata hazırlanıyorsan, sana uygun bir mod var.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {interviewTypes.map((type, i) => (
            <FadeIn key={type.id} delay={i * 0.1}>
              <div className={`group relative rounded-2xl border border-border-subtle bg-surface/40 backdrop-blur-sm p-7 transition-all duration-300 ${type.borderColor} h-full`}>
                {/* Gradient overlay */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                <div className="relative">
                  <div className={`h-12 w-12 rounded-xl ${type.accentBg} border ${type.accentBorder} flex items-center justify-center mb-5`}>
                    <type.icon size={22} className={type.accentColor} strokeWidth={1.7} />
                  </div>
                  <h3 className="font-display text-xl font-bold text-text mb-2">
                    {type.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-5 text-pretty">
                    {type.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {type.features.map((feat) => (
                      <span
                        key={feat}
                        className="text-xs px-3 py-1 rounded-full bg-surface-raised border border-border-subtle text-text-muted"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  Tech Stack                                       */
/* ────────────────────────────────────────────────── */

function TechStack() {
  const techs = [
    { name: "fal.ai", role: "AI Inference" },
    { name: "Freya", role: "Türkçe STT/TTS" },
    { name: "OpenRouter", role: "LLM Gateway" },
    { name: "React", role: "Frontend" },
    { name: "Hono", role: "API Server" },
    { name: "Convex", role: "Database" },
  ];

  return (
    <section className="py-20 border-t border-b border-border-subtle/50">
      <div className="mx-auto max-w-5xl px-6">
        <FadeIn className="text-center mb-12">
          <span className="text-xs font-semibold tracking-widest uppercase text-text-muted">
            Arkasındaki Teknoloji
          </span>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {techs.map((tech) => (
              <div key={tech.name} className="flex flex-col items-center gap-1.5 group">
                <span className="font-display text-lg font-semibold text-text-muted group-hover:text-text transition-colors duration-200">
                  {tech.name}
                </span>
                <span className="text-[10px] text-text-muted/60 uppercase tracking-wider">
                  {tech.role}
                </span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  CTA                                              */
/* ────────────────────────────────────────────────── */

function CTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber/[0.04] blur-[160px]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <FadeIn>
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-amber/10 border border-amber/20 glow-amber mb-8">
            <Mic size={32} className="text-amber" strokeWidth={1.5} />
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-text text-balance">
            Bir Sonraki Mülakatına
            <br />
            <span className="text-amber">Hazır Mısın?</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="mt-6 text-lg text-text-secondary max-w-xl mx-auto text-pretty">
            Wingman ile pratik yap, özgüvenini artır ve hayalindeki işe bir adım daha yaklaş.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 rounded-xl bg-amber text-[#07070a] px-10 py-4 text-lg font-bold hover:bg-amber-light transition-all duration-300 glow-amber hover:shadow-[0_0_40px_rgba(229,161,14,0.25)]"
            >
              Ücretsiz Başla
              <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p className="mt-6 text-xs text-text-muted">
            Kredi kartı gerekmez &middot; Hemen başlayın
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/*  Footer                                           */
/* ────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border-subtle/50 py-10">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-amber/15 border border-amber/20 flex items-center justify-center">
            <span className="font-display text-sm font-bold text-amber">W</span>
          </div>
          <span className="font-display text-sm font-semibold text-text-muted">
            Wingman AI
          </span>
        </div>
        <p className="text-xs text-text-muted">
          &copy; 2026 Wingman &middot; fal.ai Hackathon Projesi
        </p>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────────────── */
/*  Page                                             */
/* ────────────────────────────────────────────────── */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text overflow-x-hidden">
      <Nav />
      <Hero />
      <DashboardPreview />
      <Features />
      <HowItWorks />
      <InterviewTypes />
      <TechStack />
      <CTA />
      <Footer />
    </div>
  );
}
