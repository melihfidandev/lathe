import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App";
import NotFound from "./pages/NotFound";

// Tek sayfa: kök dışındaki her adres 404 ("Not on this pressing")
const isHome = ["/", "/index.html"].includes(window.location.pathname);

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

createRoot(document.getElementById("root")).render(
  <StrictMode>{isHome ? <App /> : <NotFound />}</StrictMode>,
);

if (import.meta.env.DEV) {
  import("./lib/store").then((m) => (window.__lathe = m));
}
