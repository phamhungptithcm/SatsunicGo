import { ToastHost } from "../shared/Toast";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "./ErrorBoundary";
import { App } from "./App";
import "../styles/global.css";
import "../styles/public-ux.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
        <ToastHost />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);
