import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Keep #root sized to the visible viewport so the virtual keyboard never
// pushes content up on iOS/Android.
if (window.visualViewport) {
  const onViewportResize = () => {
    document.documentElement.style.setProperty(
      "--vvh",
      `${window.visualViewport!.height}px`
    );
  };
  window.visualViewport.addEventListener("resize", onViewportResize);
  onViewportResize();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
