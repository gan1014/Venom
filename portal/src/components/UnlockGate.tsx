"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { HomeAfter } from "./HomeAfter";

export function useFilmUnlocked() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const sync = () => setDone(document.body.classList.contains("film-done"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return done;
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/" || path.startsWith("/film") || path.startsWith("/admin")) return <>{children}</>;
  return (
    <>
      <div className="lb-t" />
      <div className="lb-b" />
      <Nav />
      {children}
      <Footer />
    </>
  );
}

export function HomeAfterGate() {
  const done = useFilmUnlocked();
  if (!done) return null;
  return <HomeAfter />;
}
