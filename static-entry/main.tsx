import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import IronDemo from "../app/IronDemo";
import "../app/globals.css";

document.documentElement.lang = "fa";
document.documentElement.dir = "rtl";

const root = document.getElementById("root");

if (!root) {
  throw new Error("React root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <IronDemo />
  </StrictMode>,
);
