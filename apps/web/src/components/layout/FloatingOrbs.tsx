import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

// ─── Seeded PRNG (mulberry32) ────────────────────────────
// Pathname'den deterministik rastgele değerler üretir.
// Aynı sayfa her zaman aynı orb'ları alır.

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Color Palette ───────────────────────────────────────
// Her sayfada bunlardan rastgele seçilir

const ORB_COLORS = [
  { r: 229, g: 161, b: 14 },  // amber
  { r: 59,  g: 130, b: 246 }, // blue
  { r: 34,  g: 197, b: 94 },  // green
  { r: 168, g: 85,  b: 247 }, // purple
  { r: 239, g: 68,  b: 68 },  // red
  { r: 14,  g: 165, b: 233 }, // sky
  { r: 245, g: 158, b: 11 },  // orange
  { r: 99,  g: 102, b: 241 }, // indigo
];

// ─── Orb generation ──────────────────────────────────────

interface Orb {
  id: number;
  x: number;       // % from left  (0-100)
  y: number;       // % from top   (0-100)
  size: number;    // px
  color: typeof ORB_COLORS[number];
  opacity: number;
  duration: number; // animation cycle seconds
  dx: number[];     // x keyframes
  dy: number[];     // y keyframes
}

function generateOrbs(pathname: string): Orb[] {
  const seed = hashStr(pathname);
  const rand = mulberry32(seed);

  // 2-3 orbs per page — subtle, not overwhelming
  const count = 2 + Math.floor(rand() * 2); // 2 or 3

  const orbs: Orb[] = [];
  const usedColors = new Set<number>();

  for (let i = 0; i < count; i++) {
    // Pick a unique color
    let colorIdx: number;
    do {
      colorIdx = Math.floor(rand() * ORB_COLORS.length);
    } while (usedColors.has(colorIdx) && usedColors.size < ORB_COLORS.length);
    usedColors.add(colorIdx);

    const size = 350 + Math.floor(rand() * 300); // 350-650px
    const opacity = 0.04 + rand() * 0.04;        // 0.04-0.08

    // Position — spread across the viewport
    const x = 10 + rand() * 70;  // 10-80%
    const y = 5 + rand() * 70;   // 5-75%

    // Animation keyframes — gentle drift
    const amplitude = 20 + rand() * 35; // 20-55px
    const dx = [
      0,
      (rand() - 0.5) * amplitude * 2,
      (rand() - 0.5) * amplitude * 2,
      0,
    ];
    const dy = [
      0,
      (rand() - 0.5) * amplitude * 2,
      (rand() - 0.5) * amplitude * 2,
      0,
    ];

    const duration = 16 + rand() * 14; // 16-30s

    orbs.push({
      id: i,
      x,
      y,
      size,
      color: ORB_COLORS[colorIdx],
      opacity,
      duration,
      dx,
      dy,
    });
  }

  return orbs;
}

// ─── Component ───────────────────────────────────────────

export function FloatingOrbs() {
  const { pathname } = useLocation();

  // Normalize: /dashboard/interview/new → /dashboard/interview/new
  // But /interview/abc123 → /interview (strip dynamic IDs for consistency)
  const pageKey = useMemo(() => {
    return pathname
      .replace(/\/[a-f0-9]{16,}/, "")   // strip Convex-style IDs
      .replace(/\/[0-9]+$/, "")          // strip numeric IDs
      .replace(/\/$/, "") || "/";        // normalize trailing slash
  }, [pathname]);

  const orbs = useMemo(() => generateOrbs(pageKey), [pageKey]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <AnimatePresence mode="wait">
        <motion.div
          key={pageKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {orbs.map((orb) => {
            const { r, g, b } = orb.color;
            return (
              <motion.div
                key={orb.id}
                className="absolute rounded-full"
                style={{
                  left: `${orb.x}%`,
                  top: `${orb.y}%`,
                  width: orb.size,
                  height: orb.size,
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, rgba(${r},${g},${b},${orb.opacity}) 0%, rgba(${r},${g},${b},${orb.opacity * 0.3}) 45%, transparent 70%)`,
                }}
                animate={{
                  x: orb.dx,
                  y: orb.dy,
                }}
                transition={{
                  duration: orb.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
