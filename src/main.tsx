import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// ─── Global mobile keyboard fix ──────────────────────────────────────────────
// When the virtual keyboard opens, the Visual Viewport shrinks. We update
// #root's height to match so content stays within the visible area and is
// never hidden behind the keyboard. This covers every form in the dashboard.
function applyViewportHeight() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.getElementById("root")!.style.height = `${h}px`;
}

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", applyViewportHeight);
  window.visualViewport.addEventListener("scroll", applyViewportHeight);
}
applyViewportHeight();
// ─────────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
