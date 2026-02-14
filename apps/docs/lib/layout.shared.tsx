import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { WingLogo } from "@/components/WingLogo";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="flex items-center gap-2.5 font-bold tracking-tight">
          <WingLogo size={28} />
          <span>Wingman Docs</span>
        </span>
      ),
    },
    links: [
      {
        text: "Uygulamaya Dön",
        url: "/",
        active: "none",
      },
    ],
  };
}
