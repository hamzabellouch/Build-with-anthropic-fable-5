import { createRoot } from "react-dom/client";
import App from "./components/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { syncEngine } from "./persist/sync";
import "./app.css";

syncEngine.start();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
