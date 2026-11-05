import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import KnowledgeApp from "./knowledge/App";
import "./knowledge/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <KnowledgeApp />
    </BrowserRouter>
  </StrictMode>,
);
