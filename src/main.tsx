import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Imagens marcadas com data-fade surgem suavemente quando terminam de carregar (sem flash).
const markLoaded = (e: Event) => {
  const t = e.target as HTMLElement;
  if (t instanceof HTMLImageElement) t.dataset.loaded = "1";
};
document.addEventListener("load", markLoaded, true);
document.addEventListener("error", markLoaded, true);

createRoot(document.getElementById("root")!).render(<App />);
