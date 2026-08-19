"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/event", label: "Event" },
  { href: "/challenges", label: "Challenges" },
  { href: "/flow", label: "Flow" },
  { href: "/rules", label: "Rules" },
];

export function Nav({ loggedIn: loggedInProp }: { loggedIn?: boolean }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!loggedInProp);
  const path = usePathname();
  const home = path === "/";

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setLoggedIn(d?.role === "participant"))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setSolid(!home || window.scrollY > 80 || document.body.classList.contains("past-hero"));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const mo = new MutationObserver(onScroll);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.removeEventListener("scroll", onScroll);
      mo.disconnect();
    };
  }, [home]);

  useEffect(() => setOpen(false), [path]);

  return (
    <>
      <header className={`site-nav ${solid ? "is-solid" : ""} ${home ? "on-home" : ""}`}>
        <a href="/" className="brand">
          LEGO LEVIATHON
        </a>
        <nav className="nav-links desk" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
          {loggedIn ? (
            <a href="/dashboard" className="btn" style={{ padding: "10px 14px" }}>
              SYMBIOTE CONTROL
            </a>
          ) : (
            <a href="/register" className="btn btn-hot" style={{ padding: "10px 14px" }}>
              ENTER LEVIATHON
            </a>
          )}
        </nav>
        <button type="button" className="btn nav-burger" onClick={() => setOpen(true)} aria-label="Open menu">
          MENU
        </button>
      </header>
      {open && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          <button type="button" className="btn" onClick={() => setOpen(false)}>
            CLOSE
          </button>
          <p className="hud">LV // PROTOCOL 2026</p>
          <a href="/" className="display">
            HOME
          </a>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="display">
              {l.label}
            </a>
          ))}
          {loggedIn ? (
            <a href="/dashboard" className="btn btn-hot">
              SYMBIOTE CONTROL
            </a>
          ) : (
            <a href="/register" className="btn btn-hot">
              ENTER LEVIATHON
            </a>
          )}
          <a href="/admin" className="display">
            COMMAND CENTER
          </a>
        </div>
      )}
    </>
  );
}
