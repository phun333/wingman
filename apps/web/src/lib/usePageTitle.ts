import { useEffect } from "react";

const BASE_TITLE = "Wingman";

/**
 * Sets document.title to `{pageTitle} — Wingman` (or just "Wingman" if no pageTitle).
 */
export function usePageTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [pageTitle]);
}
