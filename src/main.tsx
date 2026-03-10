import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Settings from "./Settings";
import { getCurrentWindow } from "@tauri-apps/api/window";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const window = getCurrentWindow();
if (window.label === "settings") {
  root.render(
    <React.StrictMode>
      <Settings />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
