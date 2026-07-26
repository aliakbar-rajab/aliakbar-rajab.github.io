import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import IronDemo from "../app/IronDemo";

document.documentElement.lang = "fa";
document.documentElement.dir = "rtl";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IronDemo />
  </StrictMode>,
);
