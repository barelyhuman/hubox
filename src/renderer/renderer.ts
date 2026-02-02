import { h, render } from "preact";
import { App } from "./App";
import "./styles.css";

// Wait for DOM to be ready before setting up window controls
document.addEventListener("DOMContentLoaded", () => {
  // Window controls
  const minimizeBtn = document.getElementById("minimize-btn");
  const maximizeBtn = document.getElementById("maximize-btn");
  const closeBtn = document.getElementById("close-btn");

  minimizeBtn?.addEventListener("click", () => {
    window.electronAPI.send("window-control", "minimize");
  });

  maximizeBtn?.addEventListener("click", () => {
    window.electronAPI.send("window-control", "maximize");
  });

  closeBtn?.addEventListener("click", () => {
    window.electronAPI.send("window-control", "close");
  });

  // Handle maximize/unmaximize events to toggle title-bar visibility
  const titleBar = document.querySelector(".title-bar") as HTMLElement;

  window.electronAPI.onWindowMaximized(() => {
    console.log("maximized");
    if (titleBar) {
      titleBar.style.display = "none";
    }
  });

  window.electronAPI.onWindowUnmaximized(() => {
    if (titleBar) {
      titleBar.style.display = "flex";
    }
  });
});

render(h(App, {}), document.getElementById("app"));
