import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../app/App";
import ContactPage from "../app/ContactPage";
import "../app/globals.css";

document.documentElement.lang = "fa";
document.documentElement.dir = "rtl";

const root = document.getElementById("root");

if (!root) {
  throw new Error("React root element was not found.");
}

// /contact/ is a static clone of this same HTML/JS bundle (see
// scripts/generate-contact-page.mjs) stamped with this data attribute, the
// same trick category landing pages use for their initial category.
const isContactPage = root.dataset.page === "contact";

createRoot(root).render(
  <StrictMode>{isContactPage ? <ContactPage /> : <App />}</StrictMode>,
);
