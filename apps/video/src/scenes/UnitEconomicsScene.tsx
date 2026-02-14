import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme";
import { fontDisplay, fontBody, fontMono } from "../fonts";
import { Background } from "../components/Background";

// ─── Cost breakdown data ─────────────────────────────────

const costItems = [
  { label: "TTS (Freya)", cost: 0.70, pct: 54, color: colors.amber },
  { label: "STT (Freya)", cost: 0.32, pct: 25, color: colors.info },
  { label: "LLM (Gemini)", cost: 0.21, pct: 16, color: colors.purple },
  { label: "Infra", cost: 0.07, pct: 5, color: colors.success },
];

const TOTAL_COST = 1.30;
const PRICE = 10;
const PROFIT = PRICE - TOTAL_COST;
const MARGIN_PCT = Math.round((PROFIT / PRICE) * 100);

// ─── Competitor data ─────────────────────────────────────

const competitors = [
  { name: "Pramp", price: "$0", note: "Eşleşme bekleme", voice: false, turkish: false, highlight: false },
  { name: "Interviewing.io", price: "$249", note: "/ay", voice: true, turkish: false, highlight: false },
  { name: "Prepfully", price: "$59", note: "/ay", voice: false, turkish: false, highlight: false },
  { name: "Wingman", price: "$10", note: "/ay", voice: true, turkish: true, highlight: true },
];

// ─── Scene ───────────────────────────────────────────────

export const UnitEconomicsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Header animations
  const labelSpring = spring({ frame, fps, delay: 5, config: { damping: 200 } });
  const titleSpring = spring({ frame, fps, delay: 10, config: { damping: 200 } });
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Profit bar animation
  const profitReveal = spring({ frame, fps, delay: 60, config: { damping: 18, stiffness: 80 } });

  // Margin badge
  const marginSpring = spring({ frame, fps, delay: 72, config: { damping: 12, stiffness: 100 } });
  const marginScale = interpolate(marginSpring, [0, 1], [0, 1]);

  // Competitor table
  const tableSpring = spring({ frame, fps, delay: 85, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <Background />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          gap: 24,
        }}
      >
        {/* ── Label ── */}
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 14,
            fontWeight: 500,
            color: colors.amber,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: labelSpring,
          }}
        >
          Birim Ekonomi
        </div>

        {/* ── Title ── */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 44,
            fontWeight: 800,
            color: colors.text,
            letterSpacing: "-0.02em",
            textAlign: "center",
            opacity: titleSpring,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1.15,
          }}
        >
          Kullanıcı Başına{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.success}, #4ade80)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Kârlılık
          </span>
        </div>

        {/* ── Main content — two columns ── */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 32,
            width: "100%",
            maxWidth: 1050,
          }}
        >
          {/* ─── LEFT: Cost breakdown ─── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: "20px 24px",
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
            }}
          >
            <div
              style={{
                fontFamily: fontDisplay,
                fontSize: 14,
                fontWeight: 700,
                color: colors.textSecondary,
                letterSpacing: "0.03em",
                marginBottom: 2,
                opacity: spring({ frame, fps, delay: 20, config: { damping: 200 } }),
              }}
            >
              MALİYET DAĞILIMI
            </div>

            {costItems.map((item, i) => {
              const barDelay = 25 + i * 7;
              const barSpring = spring({ frame, fps, delay: barDelay, config: { damping: 200 } });
              const barWidth = interpolate(barSpring, [0, 1], [0, item.pct]);

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    opacity: barSpring,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: fontBody, fontSize: 13, fontWeight: 500, color: colors.text }}>
                      {item.label}
                    </span>
                    <span style={{ fontFamily: fontMono, fontSize: 13, fontWeight: 600, color: item.color }}>
                      ${item.cost.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 5, borderRadius: 3, backgroundColor: `${item.color}15` }}>
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: `linear-gradient(90deg, ${item.color}90, ${item.color})`,
                        boxShadow: `0 0 8px ${item.color}30`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: `1px solid ${colors.border}`,
                paddingTop: 10,
                marginTop: 2,
                opacity: spring({ frame, fps, delay: 52, config: { damping: 200 } }),
              }}
            >
              <span style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 700, color: colors.text }}>
                Toplam Maliyet
              </span>
              <span style={{ fontFamily: fontMono, fontSize: 18, fontWeight: 700, color: colors.danger }}>
                ${TOTAL_COST.toFixed(2)}
                <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 400, marginLeft: 4 }}>/ay</span>
              </span>
            </div>
          </div>

          {/* ─── RIGHT: Revenue & Profit ─── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "20px 24px",
              borderRadius: 16,
              border: `1px solid ${colors.amber}25`,
              background: `linear-gradient(180deg, ${colors.amber}08, ${colors.surface})`,
            }}
          >
            <div
              style={{
                fontFamily: fontDisplay,
                fontSize: 14,
                fontWeight: 700,
                color: colors.textSecondary,
                letterSpacing: "0.03em",
                opacity: spring({ frame, fps, delay: 52, config: { damping: 200 } }),
              }}
            >
              FİYATLANDIRMA
            </div>

            {/* Price */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                opacity: spring({ frame, fps, delay: 55, config: { damping: 200 } }),
              }}
            >
              <span
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 52,
                  fontWeight: 800,
                  color: colors.amber,
                  lineHeight: 1,
                }}
              >
                ${PRICE}
              </span>
              <span style={{ fontFamily: fontBody, fontSize: 18, color: colors.textMuted }}>/ay</span>
            </div>

            {/* Waterfall bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, opacity: profitReveal }}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 28,
                  borderRadius: 7,
                  overflow: "hidden",
                  backgroundColor: `${colors.success}15`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${(TOTAL_COST / PRICE) * 100 * profitReveal}%`,
                    background: `linear-gradient(90deg, ${colors.danger}60, ${colors.danger}80)`,
                    borderRadius: "7px 0 0 7px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${(TOTAL_COST / PRICE) * 100}%`,
                    top: 0,
                    bottom: 0,
                    width: `${(PROFIT / PRICE) * 100 * profitReveal}%`,
                    background: `linear-gradient(90deg, ${colors.success}80, ${colors.success})`,
                    borderRadius: "0 7px 7px 0",
                    boxShadow: `0 0 16px ${colors.success}30`,
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: `${colors.danger}80` }} />
                  <span style={{ fontFamily: fontMono, fontSize: 11, color: colors.textMuted }}>
                    Maliyet ${TOTAL_COST.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: colors.success }} />
                  <span style={{ fontFamily: fontMono, fontSize: 11, color: colors.textMuted }}>
                    Kâr ${PROFIT.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Margin badge */}
            <div
              style={{
                alignSelf: "center",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                borderRadius: 100,
                border: `1.5px solid ${colors.success}50`,
                background: `linear-gradient(135deg, ${colors.success}18, ${colors.success}08)`,
                transform: `scale(${marginScale})`,
                boxShadow: `0 0 24px ${colors.success}20`,
              }}
            >
              <span style={{ fontSize: 20 }}>📈</span>
              <span
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 26,
                  fontWeight: 800,
                  color: colors.success,
                }}
              >
                %{MARGIN_PCT}
              </span>
              <span
                style={{
                  fontFamily: fontBody,
                  fontSize: 15,
                  fontWeight: 600,
                  color: colors.textSecondary,
                }}
              >
                Gross Margin
              </span>
            </div>
          </div>
        </div>

        {/* ── Bottom: Competitor comparison table ── */}
        <div
          style={{
            width: "100%",
            maxWidth: 1050,
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            overflow: "hidden",
            opacity: tableSpring,
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 0.8fr 0.7fr 0.7fr",
              padding: "10px 24px",
              borderBottom: `1px solid ${colors.border}`,
              background: `${colors.surfaceRaised}`,
            }}
          >
            {["Rakip", "Fiyat", "Sesli AI", "Türkçe"].map((h) => (
              <span
                key={h}
                style={{
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.textMuted,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Table rows */}
          {competitors.map((comp, i) => {
            const rowDelay = 90 + i * 8;
            const rowSpring = spring({ frame, fps, delay: rowDelay, config: { damping: 200 } });
            const rowX = interpolate(rowSpring, [0, 1], [30, 0]);

            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 0.8fr 0.7fr 0.7fr",
                  padding: "10px 24px",
                  alignItems: "center",
                  borderBottom: i < competitors.length - 1 ? `1px solid ${colors.border}` : "none",
                  background: comp.highlight
                    ? `linear-gradient(90deg, ${colors.amber}10, transparent)`
                    : "transparent",
                  borderLeft: comp.highlight ? `3px solid ${colors.amber}` : "3px solid transparent",
                  opacity: rowSpring,
                  transform: `translateX(${rowX}px)`,
                }}
              >
                {/* Name */}
                <span
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 15,
                    fontWeight: comp.highlight ? 800 : 500,
                    color: comp.highlight ? colors.amber : colors.text,
                  }}
                >
                  {comp.name}
                  {comp.highlight && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontFamily: fontMono,
                        fontSize: 9,
                        fontWeight: 600,
                        color: colors.bg,
                        backgroundColor: colors.amber,
                        padding: "2px 8px",
                        borderRadius: 4,
                        verticalAlign: "middle",
                      }}
                    >
                      BİZ
                    </span>
                  )}
                </span>

                {/* Price */}
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 15,
                    fontWeight: 700,
                    color: comp.highlight ? colors.success : colors.textSecondary,
                  }}
                >
                  {comp.price}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 400,
                      color: colors.textMuted,
                      marginLeft: 2,
                    }}
                  >
                    {comp.note}
                  </span>
                </span>

                {/* Voice */}
                <span style={{ fontSize: 16 }}>
                  {comp.voice ? "✅" : "❌"}
                </span>

                {/* Turkish */}
                <span style={{ fontSize: 16 }}>
                  {comp.turkish ? "✅" : "❌"}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
