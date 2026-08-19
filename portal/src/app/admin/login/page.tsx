"use client";

import { useEffect } from "react";

export default function AdminLoginAlias() {
  useEffect(() => {
    window.location.replace("/admin");
  }, []);
  return (
    <div className="cmd-login">
      <p className="hud">OPENING COMMAND CENTER...</p>
    </div>
  );
}
