import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { driver, type DriveStep, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour-theme.css";

const TOUR_STORAGE_KEY = "wingman_tour_completed";

const tourSteps: DriveStep[] = [
  {
    // Step 0 — Welcome modal (no element)
    popover: {
      title: "Wingman'e Hoş Geldin",
      description:
        "Yapay zekâ destekli sesli mülakat simülatörün hazır. Seni hızlıca gezdireyim — sadece 30 saniye sürecek.",
      side: "over" as const,
      align: "center" as const,
    },
  },
  {
    // Step 1 — Stats row
    element: "#tour-stats",
    popover: {
      title: "Performans İstatistiklerin",
      description:
        "Toplam mülakat sayın, bu haftaki aktiviten ve başarı oranın burada. Her mülakattan sonra güncellenir.",
      side: "bottom" as const,
      align: "center" as const,
    },
  },
  {
    // Step 2 — Start interview prompt bar
    element: "#tour-start-interview",
    popover: {
      title: "Hemen Mülakata Başla",
      description:
        "Buraya tıkla, tür seç, zorluk ayarla, AI mülakatçınla sesli konuşmaya başla. Live Coding, System Design, Phone Screen veya Serbest Pratik modlarından birini seçebilirsin.",
      side: "bottom" as const,
      align: "center" as const,
    },
  },
  {
    // Step 3 — Questions nav
    element: "#tour-nav-questions",
    popover: {
      title: "Soru Bankası",
      description:
        "1800'den fazla LeetCode sorusu, şirketlere göre filtrele, FAANG sorularını keşfet ve çalışma planı oluştur.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    // Step 4 — Jobs nav
    element: "#tour-nav-jobs",
    popover: {
      title: "İş Yolları",
      description:
        "CV'ni yükle, iş ilanı ekle — AI sana özel mülakat soruları ve çalışma planı hazırlasın.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    // Step 5 — Progress nav
    element: "#tour-nav-progress",
    popover: {
      title: "İlerleme Takibi",
      description:
        "Mülakat performansını zaman içinde takip et. Güçlü ve zayıf yönlerini, skor trendini ve beceri radarını gör.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    // Step 6 — Settings nav
    element: "#tour-nav-settings",
    popover: {
      title: "Profil ve CV",
      description:
        "CV'ni yükle, ilgi alanlarını belirle, hedeflerini tanımla — AI mülakatçın seni tanısın ve kişisel sorular sorsun.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    // Step 7 — Finale modal (no element)
    popover: {
      title: "Her Şey Hazır",
      description:
        "İlk mülakatını başlat — mikrofon izni isteyeceğiz, sonra AI mülakatçın seni sesli olarak karşılayacak. Başarılar!",
      side: "over" as const,
      align: "center" as const,
    },
  },
];

export function useTour(options?: { autoStart?: boolean }) {
  const autoStart = options?.autoStart ?? true;
  const driverRef = useRef<Driver | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const startTour = useCallback(() => {
    // Clean up any existing instance
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const driverObj = driver({
      animate: true,
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      showButtons: ["next", "previous", "close"],
      nextBtnText: "İleri →",
      prevBtnText: "← Geri",
      doneBtnText: "Hadi Başlayalım! 🚀",
      popoverClass: "wingman-tour",
      overlayColor: "#07070a",
      overlayOpacity: 0.55,
      stagePadding: 12,
      stageRadius: 12,
      smoothScroll: true,
      allowKeyboardControl: true,
      steps: tourSteps,
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
        driverObj.destroy();
      },
    });

    driverRef.current = driverObj;
    driverObj.drive();
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);

    // If not on dashboard, navigate there first then start
    if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
      // Wait for navigation + render
      setTimeout(startTour, 800);
    } else {
      setTimeout(startTour, 100);
    }
  }, [startTour, navigate, location.pathname]);

  // Auto-start on first visit (only when autoStart is true)
  useEffect(() => {
    if (!autoStart) return;

    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (completed) return;

    // Wait for dashboard content to render
    const timer = setTimeout(startTour, 600);

    return () => {
      clearTimeout(timer);
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, [startTour, autoStart]);

  return { startTour, restartTour };
}
