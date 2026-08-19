(() => {
  "use strict";

  function unlock() {
    if (document.body.classList.contains("film-done")) return;
    document.body.classList.add("film-done", "past-hero");
    document.documentElement.classList.add("film-done", "past-hero");
    setTimeout(() => {
      const el = document.getElementById("protocol");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#carnage-btn, .hero-end-cta a, .hero-end-cta button");
    if (!btn) return;
    e.preventDefault();
    unlock();
  });
})();
