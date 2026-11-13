import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/newsreader/latin-400.css";
import "@fontsource/newsreader/latin-400-italic.css";
import "@fontsource/newsreader/latin-600.css";
import "@fontsource/source-sans-3/latin-400.css";
import "@fontsource/source-sans-3/latin-600.css";
import App from "./App";
import { PitchPage } from "./pages/PitchPage";
import { SlidesPage } from "./pages/SlidesPage";
import "./index.css";

function currentPage(): "slides" | "pitch" | "desk" {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/slides") return "slides";
  return window.location.hash.startsWith("#pitch") ? "pitch" : "desk";
}

function Root() {
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    const sync = () => setPage(currentPage());
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  useEffect(() => {
    if (page === "desk") window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    document.documentElement.lang = page === "desk" ? "en" : "fr";
    document.title =
      page === "slides" ? "Lingo — présentation" : page === "pitch" ? "Lingo — pitch au comité" : "Lingo Translator";
  }, [page]);

  if (page === "slides") return <SlidesPage />;
  return page === "pitch" ? <PitchPage /> : <App />;
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root is missing.");

createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
