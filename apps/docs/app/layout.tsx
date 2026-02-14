import { RootProvider } from "fumadocs-ui/provider";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";
import type { ReactNode } from "react";
import "./global.css";

export const metadata = {
  title: {
    default: "Wingman Docs",
    template: "%s | Wingman Docs",
  },
  description:
    "Wingman — AI destekli mülakat hazırlık platformu dokümantasyonu",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="flex min-h-screen flex-col"
        style={{
          fontFamily: '"DM Sans", sans-serif',
          backgroundColor: "#07070a",
        }}
      >
        <RootProvider
          theme={{
            defaultTheme: "dark",
            forcedTheme: "dark",
          }}
          search={{
            enabled: true,
            type: "fetch",
            api: "/api/docs-search",
          }}
        >
          <DocsLayout {...baseOptions()} tree={source.getPageTree()}>
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
