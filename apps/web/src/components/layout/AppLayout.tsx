import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { FloatingOrbs } from "./FloatingOrbs";
import { ToastProvider } from "@/components/ui/Toast";

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-bg">
        <FloatingOrbs />
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar />
          <main ref={mainRef} className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
