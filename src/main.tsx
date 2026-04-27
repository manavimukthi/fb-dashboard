import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ─── Fix: Visual Viewport resize → update #root height ───────────────────────
// When the virtual keyboard opens, visualViewport.height shrinks to the visible
// area. We push that exact height onto #root so the layout never overflows
// behind the keyboard. Works globally — covers every form on every page.
function applyViewportHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  const root = document.getElementById("root");
  if (root) root.style.height = `${h}px`;
}

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", applyViewportHeight, { passive: true });
  window.visualViewport.addEventListener("scroll", applyViewportHeight, { passive: true });
}
applyViewportHeight();

// ─── Fix: Scroll focused input into view above keyboard ──────────────────────
// After the keyboard finishes sliding up (~300 ms), scroll the focused element
// to the centre of the visible area. Uses event delegation on document so it
// works for every input/textarea/select rendered anywhere in the app — no
// per-page wiring needed.
document.addEventListener(
  "focusin",
  (e) => {
    const t = e.target;
    if (
      t instanceof HTMLInputElement ||
      t instanceof HTMLTextAreaElement ||
      t instanceof HTMLSelectElement
    ) {
      setTimeout(() => {
        t.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  },
  { passive: true }
);
// ─────────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
