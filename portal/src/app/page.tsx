"use client";

import { useEffect, useState } from "react";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { HomeAfter } from "../components/HomeAfter";

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data === "LEVIATHAN_UNLOCK") setUnlocked(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  if (!unlocked) {
    return (
      <iframe
        src="/film/index.html"
        title="LEGO LEVIATHON"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          background: "#040406",
          zIndex: 200,
        }}
      />
    );
  }

  return (
    <>
      <Nav />
      <HomeAfter />
      <Footer />
    </>
  );
}
